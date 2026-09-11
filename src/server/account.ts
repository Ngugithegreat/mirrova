import { eq, and, desc } from "drizzle-orm";
import { users, sessions, copies, activity } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { hashPassword, verifyPassword, newSessionToken, hashToken } from "./auth";
import { computeCopyValueCents } from "@/lib/copyValue";
import { getTrader } from "@/lib/traders";
import { getUserAccountType } from "./accountTypes";
import { getAccountType, type AccountTypeId } from "@/lib/accountTypes";

const SESSION_DAYS = 30;

type Result<T> = { ok: false; error: string } | ({ ok: true } & T);
function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

async function createSession(db: AppDb, userId: string) {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.insert(sessions).values({ userId, tokenHash: hashToken(token), expiresAt });
  return token;
}

export async function signUp(
  db: AppDb,
  name: string,
  email: string,
  password: string,
  accountTypeId: AccountTypeId = "standard"
): Promise<Result<{ token: string }>> {
  if (password.length < 8) return fail("Password must be at least 8 characters.");

  const normalizedEmail = email.trim().toLowerCase();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1);
  if (existing) return fail("An account with this email already exists.");

  const type = getAccountType(accountTypeId);
  const [user] = await db
    .insert(users)
    .values({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      cashCents: type.demoCreditCents,
      accountType: type.id,
    })
    .returning();

  await db.insert(activity).values({
    userId: user.id,
    text: `${type.name} account created — $${(type.demoCreditCents / 100).toLocaleString()} practice balance funded`,
  });

  const token = await createSession(db, user.id);
  return { ok: true, token };
}

export async function logIn(db: AppDb, email: string, password: string): Promise<Result<{ token: string }>> {
  const normalizedEmail = email.trim().toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return fail("Incorrect email or password.");
  }
  const token = await createSession(db, user.id);
  return { ok: true, token };
}

export async function logOut(db: AppDb, token: string) {
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}

export async function getUserByToken(db: AppDb, token: string) {
  const [row] = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, hashToken(token)))
    .limit(1);
  if (!row || row.expiresAt < new Date()) return null;
  return row.user;
}

export async function getPortfolio(db: AppDb, userId: string) {
  const userCopies = await db
    .select()
    .from(copies)
    .where(and(eq(copies.userId, userId), eq(copies.active, true)));
  const closedCopies = await db
    .select()
    .from(copies)
    .where(and(eq(copies.userId, userId), eq(copies.active, false)))
    .orderBy(desc(copies.stoppedAt))
    .limit(20);
  const recentActivity = await db
    .select()
    .from(activity)
    .where(eq(activity.userId, userId))
    .orderBy(desc(activity.createdAt))
    .limit(20);
  const accountType = await getUserAccountType(db, userId);
  return { copies: userCopies, closedCopies, activity: recentActivity, accountType };
}

export async function startCopy(
  db: AppDb,
  userId: string,
  traderSlug: string,
  amountCents: number,
  stopLossPct: number,
  minCopyCents: number
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
): Promise<Result<{}>> {
  if (amountCents < minCopyCents) return fail("Amount is below this trader's minimum.");

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return fail("Not signed in.");
  if (amountCents > user.cashCents) return fail("Not enough available cash.");

  const [already] = await db
    .select({ id: copies.id })
    .from(copies)
    .where(and(eq(copies.userId, userId), eq(copies.traderSlug, traderSlug), eq(copies.active, true)))
    .limit(1);
  if (already) return fail("You're already copying this trader.");

  const activeCopies = await db
    .select({ id: copies.id })
    .from(copies)
    .where(and(eq(copies.userId, userId), eq(copies.active, true)));
  const accountType = await getUserAccountType(db, userId);
  if (activeCopies.length >= accountType.maxConcurrentCopies) {
    return fail(`Your ${accountType.name} account allows up to ${accountType.maxConcurrentCopies} concurrent copies — stop one first, or switch to an account type with a higher limit.`);
  }

  await db.insert(copies).values({ userId, traderSlug, amountCents, stopLossPct });
  await db.update(users).set({ cashCents: user.cashCents - amountCents }).where(eq(users.id, userId));
  await db.insert(activity).values({
    userId,
    text: `Started copying ${traderSlug} with $${(amountCents / 100).toLocaleString()} (stop-loss ${stopLossPct}%)`,
  });

  return { ok: true };
}

export async function stopCopy(db: AppDb, userId: string, traderSlug: string): Promise<Result<{ valueCents: number; feeCents: number }>> {
  const [copy] = await db
    .select()
    .from(copies)
    .where(and(eq(copies.userId, userId), eq(copies.traderSlug, traderSlug), eq(copies.active, true)))
    .limit(1);
  if (!copy) return fail("No active copy found.");

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return fail("Not signed in.");

  const grossValueCents = computeCopyValueCents({
    slug: copy.traderSlug,
    amountCents: copy.amountCents,
    stopLossPct: copy.stopLossPct,
    startedAt: copy.startedAt,
  });

  const trader = getTrader(copy.traderSlug);
  const profitCents = Math.max(0, grossValueCents - copy.amountCents);
  const feeCents = profitCents > 0 && trader ? Math.round((profitCents * trader.perfFee) / 100) : 0;
  const valueCents = grossValueCents - feeCents;

  await db
    .update(copies)
    .set({ active: false, stoppedAt: new Date(), valueCents, pnlCents: valueCents - copy.amountCents })
    .where(eq(copies.id, copy.id));
  await db.update(users).set({ cashCents: user.cashCents + valueCents }).where(eq(users.id, userId));
  await db.insert(activity).values({
    userId,
    text:
      feeCents > 0
        ? `Stopped copying ${traderSlug} — $${Math.round(valueCents / 100).toLocaleString()} returned to cash (performance fee $${(feeCents / 100).toFixed(2)})`
        : `Stopped copying ${traderSlug} — $${Math.round(valueCents / 100).toLocaleString()} returned to cash`,
  });

  return { ok: true, valueCents, feeCents };
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export async function updateName(db: AppDb, userId: string, name: string): Promise<Result<{}>> {
  const trimmed = name.trim();
  if (trimmed.length < 2) return fail("Enter your name.");
  await db.update(users).set({ name: trimmed }).where(eq(users.id, userId));
  return { ok: true };
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export async function changePassword(db: AppDb, userId: string, currentPassword: string, newPassword: string): Promise<Result<{}>> {
  if (newPassword.length < 8) return fail("New password must be at least 8 characters.");
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return fail("Not signed in.");
  if (!verifyPassword(currentPassword, user.passwordHash)) return fail("Current password is incorrect.");
  await db.update(users).set({ passwordHash: hashPassword(newPassword) }).where(eq(users.id, userId));
  return { ok: true };
}

export async function updateNotificationPrefs(
  db: AppDb,
  userId: string,
  prefs: { notifyProductUpdates?: boolean; notifySignalAlerts?: boolean }
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
): Promise<Result<{}>> {
  await db.update(users).set(prefs).where(eq(users.id, userId));
  return { ok: true };
}

/** Resets the practice balance to the account type's demo credit and stops
 * every active demo copy (returning nothing to cash first — this is a hard
 * reset for testing, not a "stop and settle" action). Never touches
 * realCashCents or any real allocation. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export async function resetDemoAccount(db: AppDb, userId: string): Promise<Result<{}>> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return fail("Not signed in.");
  const accountType = await getUserAccountType(db, userId);
  await db.update(copies).set({ active: false, stoppedAt: new Date() }).where(and(eq(copies.userId, userId), eq(copies.active, true)));
  await db.update(users).set({ cashCents: accountType.demoCreditCents }).where(eq(users.id, userId));
  await db.insert(activity).values({ userId, text: "Reset demo account to a fresh practice balance" });
  return { ok: true };
}
