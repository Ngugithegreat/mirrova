import { eq } from "drizzle-orm";
import { users, cryptoPayments, activity } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { createPayment, getPaymentStatus } from "./nowpayments";

type Result<T> = { ok: false; error: string } | ({ ok: true } & T);
function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

export async function initiateCryptoDeposit(
  db: AppDb,
  userId: string,
  amountUsd: number,
  callbackUrl: string,
  payCurrency?: string
): Promise<Result<{ providerPaymentId: string; payAddress: string; payCurrency: string }>> {
  const created = await createPayment(amountUsd, userId, callbackUrl, payCurrency);
  if (!created.ok) return fail(created.error);

  await db.insert(cryptoPayments).values({
    userId,
    providerPaymentId: created.providerPaymentId,
    payCurrency: created.payCurrency,
    priceAmountUsd: amountUsd,
    payAddress: created.payAddress,
    status: "pending",
  });

  return { ok: true, providerPaymentId: created.providerPaymentId, payAddress: created.payAddress, payCurrency: created.payCurrency };
}

/** Idempotent: only ever settles a payment once, mirroring completeDeposit's
 * same status !== "pending" guard for M-Pesa. */
async function completeCryptoDeposit(db: AppDb, providerPaymentId: string, opts: { completed: boolean; actuallyPaidUsd?: number }) {
  const [payment] = await db.select().from(cryptoPayments).where(eq(cryptoPayments.providerPaymentId, providerPaymentId)).limit(1);
  if (!payment || payment.status !== "pending") return;

  if (opts.completed) {
    const usdCents = Math.round((opts.actuallyPaidUsd ?? payment.priceAmountUsd) * 100);
    await db
      .update(cryptoPayments)
      .set({ status: "completed", creditedUsdCents: usdCents, completedAt: new Date() })
      .where(eq(cryptoPayments.id, payment.id));

    const [user] = await db.select().from(users).where(eq(users.id, payment.userId)).limit(1);
    if (user) {
      await db.update(users).set({ realCashCents: user.realCashCents + usdCents }).where(eq(users.id, user.id));
      await db.insert(activity).values({
        userId: user.id,
        text: `Crypto deposit credited as $${(usdCents / 100).toFixed(2)} to your real balance`,
      });
    }
  } else {
    await db.update(cryptoPayments).set({ status: "failed" }).where(eq(cryptoPayments.id, payment.id));
  }
}

export async function handleCryptoIpn(db: AppDb, providerPaymentId: string, paymentStatus: string, actuallyPaidUsd?: number) {
  if (paymentStatus === "finished" || paymentStatus === "confirmed") {
    await completeCryptoDeposit(db, providerPaymentId, { completed: true, actuallyPaidUsd });
  } else if (paymentStatus === "failed" || paymentStatus === "expired" || paymentStatus === "refunded") {
    await completeCryptoDeposit(db, providerPaymentId, { completed: false });
  }
}

/** Status-poll fallback, the same role reconcileDeposit plays for M-Pesa. */
export async function reconcileCryptoDeposit(
  db: AppDb,
  providerPaymentId: string
): Promise<Result<{ status: string; creditedUsdCents?: number }>> {
  const [payment] = await db.select().from(cryptoPayments).where(eq(cryptoPayments.providerPaymentId, providerPaymentId)).limit(1);
  if (!payment) return fail("Unknown payment.");

  if (payment.status === "pending") {
    const q = await getPaymentStatus(providerPaymentId);
    if (q.status === "completed") {
      await completeCryptoDeposit(db, providerPaymentId, { completed: true, actuallyPaidUsd: q.actuallyPaidUsd });
    } else if (q.status === "failed") {
      await completeCryptoDeposit(db, providerPaymentId, { completed: false });
    }
  }

  const [fresh] = await db.select().from(cryptoPayments).where(eq(cryptoPayments.providerPaymentId, providerPaymentId)).limit(1);
  return { ok: true, status: fresh?.status ?? "pending", creditedUsdCents: fresh?.creditedUsdCents ?? undefined };
}
