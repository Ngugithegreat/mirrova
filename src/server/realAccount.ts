import { eq, and, desc } from "drizzle-orm";
import { users, payments, cryptoPayments, realAllocations, kycProfiles, activity, bonusGrants } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { getTrader } from "@/lib/traders";
import { ACCOUNT_TYPES, isAccountTypeId, type AccountTypeId } from "@/lib/accountTypes";
import { kesToUsdCents, usdKesRate } from "./fx";

const MIN_DEPOSIT_USD = 50;
import { stkPush, stkQuery, normalizeKenyanPhone } from "./mpesa";
import { getUserAccountType, getTotalDeposited, setUserAccountType } from "./accountTypes";
import { listWithdrawals } from "./withdrawals";
import { getEngineView } from "./copyEngine";

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
  if (!Number.isFinite(amountKes) || amountKes <= 0) return fail("Enter a valid amount.");
  const rate = await usdKesRate();
  const minKes = Math.ceil(MIN_DEPOSIT_USD * rate);
  if (amountKes < minKes) return fail(`Minimum deposit is KES ${minKes.toLocaleString()} (~$${MIN_DEPOSIT_USD}).`);
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

/** Admin-only goodwill credit — a deliberate, logged addition to a user's
 * real balance, spendable/allocatable/withdrawable exactly like a real
 * deposit. Not trading P&L; see bonusGrants' module doc in schema.ts. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export async function grantBonus(db: AppDb, userId: string, amountUsdCents: number, note?: string): Promise<Result<{}>> {
  if (!Number.isFinite(amountUsdCents) || amountUsdCents <= 0) return fail("Enter a valid bonus amount.");
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return fail("User not found.");

  await db.update(users).set({ realCashCents: user.realCashCents + amountUsdCents }).where(eq(users.id, userId));
  await db.insert(bonusGrants).values({ userId, amountCents: amountUsdCents, note });
  await db.insert(activity).values({
    userId,
    text: `Received a $${(amountUsdCents / 100).toFixed(2)} bonus credited to your real balance${note ? ` — ${note}` : ""}`,
  });

  return { ok: true };
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
  const recentCryptoPayments = await db
    .select()
    .from(cryptoPayments)
    .where(eq(cryptoPayments.userId, userId))
    .orderBy(desc(cryptoPayments.createdAt))
    .limit(10);
  const accountType = await getUserAccountType(db, userId);
  const totalDepositedUsdCents = await getTotalDeposited(db, userId);
  const eligibleAccountTypes = ACCOUNT_TYPES.filter((t) => totalDepositedUsdCents >= t.minDepositUsdCents).map((t) => t.id);
  const recentWithdrawals = await listWithdrawals(db, userId);
  const [kyc] = await db.select({ status: kycProfiles.status }).from(kycProfiles).where(eq(kycProfiles.userId, userId)).limit(1);
  const engine = await getEngineView(db, userId);
  return {
    realCashCents: user?.realCashCents ?? 0,
    allocation: allocation ?? null,
    payments: recentPayments,
    cryptoPayments: recentCryptoPayments,
    withdrawals: recentWithdrawals,
    accountType,
    totalDepositedUsdCents,
    eligibleAccountTypes,
    kycStatus: kyc?.status ?? "unsubmitted",
    engine,
  };
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export async function switchAccountType(db: AppDb, userId: string, accountTypeId: string): Promise<Result<{}>> {
  if (!isAccountTypeId(accountTypeId)) return fail("Unknown account type.");
  const target = ACCOUNT_TYPES.find((t) => t.id === accountTypeId)!;
  const totalDepositedUsdCents = await getTotalDeposited(db, userId);
  if (totalDepositedUsdCents < target.minDepositUsdCents) {
    return fail(`Deposit at least $${(target.minDepositUsdCents / 100).toLocaleString()} lifetime to switch to ${target.name}.`);
  }
  await setUserAccountType(db, userId, accountTypeId as AccountTypeId);
  await db.insert(activity).values({ userId, text: `Switched to the ${target.name} account type` });
  return { ok: true };
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

  const accountType = await getUserAccountType(db, userId);
  const totalDepositedUsdCents = await getTotalDeposited(db, userId);
  if (totalDepositedUsdCents < accountType.minDepositUsdCents) {
    return fail(
      `Deposit at least $${(accountType.minDepositUsdCents / 100).toLocaleString()} lifetime to activate real copying on your ${accountType.name} account.`
    );
  }

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
