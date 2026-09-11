import { eq, and, desc } from "drizzle-orm";
import { users, payments, realAllocations, activity } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { getTrader } from "@/lib/traders";
import { kesToUsdCents } from "./fx";
import { stkPush, stkQuery, normalizeKenyanPhone } from "./mpesa";

type Result<T> = { ok: false; error: string } | ({ ok: true } & T);
function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

export async function initiateDeposit(
  db: AppDb,
  userId: string,
  phoneRaw: string,
  amountKes: number
): Promise<Result<{ checkoutRequestId: string }>> {
  const phone = normalizeKenyanPhone(phoneRaw);
  if (!phone) return fail("Enter a valid Kenyan phone number (e.g. 0712345678).");
  if (!Number.isFinite(amountKes) || amountKes < 10) return fail("Minimum deposit is KES 10.");
  if (amountKes > 150_000) return fail("Maximum per transaction is KES 150,000.");

  const push = await stkPush(phone, amountKes, "Asport Traders");
  if (!push.ok) return fail(push.error);

  await db.insert(payments).values({
    userId,
    phone,
    kesCents: Math.round(amountKes * 100),
    checkoutRequestId: push.checkoutRequestId,
    merchantRequestId: push.merchantRequestId,
    status: "pending",
  });

  return { ok: true, checkoutRequestId: push.checkoutRequestId };
}

/** Idempotent: only ever settles a payment once, regardless of how many
 * times the callback or a status poll tries to complete it. */
async function completeDeposit(
  db: AppDb,
  checkoutRequestId: string,
  opts: { resultCode: number; resultDesc: string; mpesaReceipt?: string }
) {
  const [payment] = await db.select().from(payments).where(eq(payments.checkoutRequestId, checkoutRequestId)).limit(1);
  if (!payment || payment.status !== "pending") return;

  if (opts.resultCode === 0) {
    const { usdCents, rate } = await kesToUsdCents(payment.kesCents);
    await db
      .update(payments)
      .set({
        status: "completed",
        fxRate: rate,
        creditedUsdCents: usdCents,
        mpesaReceipt: opts.mpesaReceipt,
        resultDesc: opts.resultDesc,
        completedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    const [user] = await db.select().from(users).where(eq(users.id, payment.userId)).limit(1);
    if (user) {
      await db.update(users).set({ realCashCents: user.realCashCents + usdCents }).where(eq(users.id, user.id));
      await db.insert(activity).values({
        userId: user.id,
        text: `M-Pesa deposit of KES ${(payment.kesCents / 100).toLocaleString()} credited as $${(usdCents / 100).toFixed(2)} to your real balance`,
      });
    }
  } else {
    await db.update(payments).set({ status: "failed", resultDesc: opts.resultDesc }).where(eq(payments.id, payment.id));
  }
}

export async function handleStkCallback(
  db: AppDb,
  checkoutRequestId: string,
  resultCode: number,
  resultDesc: string,
  mpesaReceipt?: string
) {
  await completeDeposit(db, checkoutRequestId, { resultCode, resultDesc, mpesaReceipt });
}

/** Safaricom's STK callback is unreliable — this actively asks Safaricom for
 * the real status and settles it, the same fix proven on PrimeStone. */
export async function reconcileDeposit(
  db: AppDb,
  checkoutRequestId: string
): Promise<Result<{ status: string; creditedUsdCents?: number }>> {
  const [payment] = await db.select().from(payments).where(eq(payments.checkoutRequestId, checkoutRequestId)).limit(1);
  if (!payment) return fail("Unknown payment.");

  if (payment.status === "pending") {
    const q = await stkQuery(checkoutRequestId);
    if (q.status === "completed") {
      await completeDeposit(db, checkoutRequestId, { resultCode: 0, resultDesc: "Success", mpesaReceipt: q.mpesaReceipt });
    } else if (q.status === "failed") {
      await completeDeposit(db, checkoutRequestId, { resultCode: 1, resultDesc: q.reason });
    }
  }

  const [fresh] = await db.select().from(payments).where(eq(payments.checkoutRequestId, checkoutRequestId)).limit(1);
  return { ok: true, status: fresh?.status ?? "pending", creditedUsdCents: fresh?.creditedUsdCents ?? undefined };
}

export async function getRealAccount(db: AppDb, userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const [allocation] = await db
    .select()
    .from(realAllocations)
    .where(and(eq(realAllocations.userId, userId), eq(realAllocations.active, true)))
    .limit(1);
  const recentPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt))
    .limit(10);
  return { realCashCents: user?.realCashCents ?? 0, allocation: allocation ?? null, payments: recentPayments };
}

/** All-or-nothing by design: the entire available real balance moves to one
 * strategist, never a partial amount — this is a decision the client made
 * up front (see server/realAccount.ts module doc), not an oversight. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export async function allocateReal(db: AppDb, userId: string, traderSlug: string): Promise<Result<{}>> {
  if (!getTrader(traderSlug)) return fail("Unknown trader.");

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return fail("Not signed in.");
  if (user.realCashCents <= 0) return fail("No available real balance to allocate — deposit first.");

  const [existing] = await db
    .select({ id: realAllocations.id })
    .from(realAllocations)
    .where(and(eq(realAllocations.userId, userId), eq(realAllocations.active, true)))
    .limit(1);
  if (existing) return fail("You already have an active real allocation — stop it before switching providers.");

  const amountCents = user.realCashCents;
  await db.insert(realAllocations).values({ userId, traderSlug, amountCents });
  await db.update(users).set({ realCashCents: 0 }).where(eq(users.id, userId));
  await db.insert(activity).values({
    userId,
    text: `Allocated your full real balance ($${(amountCents / 100).toLocaleString()}) to copy ${traderSlug} with real funds`,
  });

  return { ok: true };
}

/** Returns the exact principal to available balance — no invented P&L. Real
 * trade execution/settlement doesn't exist yet; this module never fabricates
 * a return on real money. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export async function deallocateReal(db: AppDb, userId: string): Promise<Result<{}>> {
  const [alloc] = await db
    .select()
    .from(realAllocations)
    .where(and(eq(realAllocations.userId, userId), eq(realAllocations.active, true)))
    .limit(1);
  if (!alloc) return fail("No active real allocation found.");

  await db.update(realAllocations).set({ active: false, stoppedAt: new Date() }).where(eq(realAllocations.id, alloc.id));

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user) {
    await db.update(users).set({ realCashCents: user.realCashCents + alloc.amountCents }).where(eq(users.id, userId));
  }
  await db.insert(activity).values({
    userId,
    text: `Stopped real copy of ${alloc.traderSlug} — $${(alloc.amountCents / 100).toLocaleString()} principal returned to your available balance`,
  });

  return { ok: true };
}
