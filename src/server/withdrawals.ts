import { eq, desc } from "drizzle-orm";
import { users, withdrawals, kycProfiles, activity } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { normalizeKenyanPhone } from "./mpesa";

type Result<T> = { ok: false; error: string } | ({ ok: true } & T);
function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

const MIN_WITHDRAWAL_CENTS = 5000; // $50

/** Debits realCashCents immediately — the request locks the funds the
 * moment it's made, same "commit first" pattern allocateReal already uses.
 * There's no automated payout rail (M-Pesa C2B only), so this is paid out
 * manually by an admin. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export async function requestWithdrawal(db: AppDb, userId: string, amountUsdCents: number, phoneRaw: string): Promise<Result<{}>> {
  const phone = normalizeKenyanPhone(phoneRaw);
  if (!phone) return fail("Enter a valid Kenyan phone number (e.g. 0712345678).");
  if (!Number.isFinite(amountUsdCents) || amountUsdCents < MIN_WITHDRAWAL_CENTS) {
    return fail(`Minimum withdrawal is $${(MIN_WITHDRAWAL_CENTS / 100).toFixed(2)}.`);
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return fail("Not signed in.");
  if (amountUsdCents > user.realCashCents) return fail("Amount exceeds your available real balance.");

  const [kyc] = await db.select({ status: kycProfiles.status }).from(kycProfiles).where(eq(kycProfiles.userId, userId)).limit(1);
  if (kyc?.status !== "verified") return fail("Verify your identity before withdrawing.");

  await db.update(users).set({ realCashCents: user.realCashCents - amountUsdCents }).where(eq(users.id, userId));
  await db.insert(withdrawals).values({ userId, amountUsdCents, phone });
  await db.insert(activity).values({
    userId,
    text: `Requested a withdrawal of $${(amountUsdCents / 100).toFixed(2)} to ${phone}`,
  });

  return { ok: true };
}

export async function listWithdrawals(db: AppDb, userId: string) {
  return db.select().from(withdrawals).where(eq(withdrawals.userId, userId)).orderBy(desc(withdrawals.requestedAt)).limit(10);
}

export async function listAllWithdrawals(db: AppDb, status?: string) {
  return db
    .select()
    .from(withdrawals)
    .where(status ? eq(withdrawals.status, status) : undefined)
    .orderBy(desc(withdrawals.requestedAt))
    .limit(100);
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export async function markWithdrawalPaid(db: AppDb, id: string, note?: string): Promise<Result<{}>> {
  const [w] = await db.select().from(withdrawals).where(eq(withdrawals.id, id)).limit(1);
  if (!w) return fail("Unknown withdrawal.");
  if (w.status !== "pending") return fail("This withdrawal was already resolved.");

  await db.update(withdrawals).set({ status: "paid", note: note ?? null, resolvedAt: new Date() }).where(eq(withdrawals.id, id));
  await db.insert(activity).values({
    userId: w.userId,
    text: `Withdrawal of $${(w.amountUsdCents / 100).toFixed(2)} marked paid`,
  });
  return { ok: true };
}

/** The lock made at request time was provisional, not a real payout — so
 * rejecting refunds it back to the user's available real balance. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export async function rejectWithdrawal(db: AppDb, id: string, note?: string): Promise<Result<{}>> {
  const [w] = await db.select().from(withdrawals).where(eq(withdrawals.id, id)).limit(1);
  if (!w) return fail("Unknown withdrawal.");
  if (w.status !== "pending") return fail("This withdrawal was already resolved.");

  await db.update(withdrawals).set({ status: "rejected", note: note ?? null, resolvedAt: new Date() }).where(eq(withdrawals.id, id));
  const [user] = await db.select().from(users).where(eq(users.id, w.userId)).limit(1);
  if (user) {
    await db.update(users).set({ realCashCents: user.realCashCents + w.amountUsdCents }).where(eq(users.id, w.userId));
  }
  await db.insert(activity).values({
    userId: w.userId,
    text: `Withdrawal of $${(w.amountUsdCents / 100).toFixed(2)} was rejected — funds returned to your available balance`,
  });
  return { ok: true };
}
