import { eq, and, desc } from "drizzle-orm";
import { users, sessions, copies, activity } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { hashPassword, verifyPassword, newSessionToken, hashToken } from "./auth";
import { computeCopyValueCents } from "@/lib/copyValue";

export const START_CASH_CENTS = 100_000 * 100; // $100,000 practice balance
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
  password: string
): Promise<Result<{ token: string }>> {
  if (password.length < 8) return fail("Password must be at least 8 characters.");

  const normalizedEmail = email.trim().toLowerCase();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1);
  if (existing) return fail("An account with this email already exists.");

  const [user] = await db
    .insert(users)
    .values({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      cashCents: START_CASH_CENTS,
    })
    .returning();

  await db.insert(activity).values({
    userId: user.id,
    text: `Account created — $${(START_CASH_CENTS / 100).toLocaleString()} practice balance funded`,
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
  const recentActivity = await db
    .select()
    .from(activity)
    .where(eq(activity.userId, userId))
    .orderBy(desc(activity.createdAt))
    .limit(20);
  return { copies: userCopies, activity: recentActivity };
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

  await db.insert(copies).values({ userId, traderSlug, amountCents, stopLossPct });
  await db.update(users).set({ cashCents: user.cashCents - amountCents }).where(eq(users.id, userId));
  await db.insert(activity).values({
    userId,
    text: `Started copying ${traderSlug} with $${(amountCents / 100).toLocaleString()} (stop-loss ${stopLossPct}%)`,
  });

  return { ok: true };
}

export async function stopCopy(db: AppDb, userId: string, traderSlug: string): Promise<Result<{ valueCents: number }>> {
  const [copy] = await db
    .select()
    .from(copies)
    .where(and(eq(copies.userId, userId), eq(copies.traderSlug, traderSlug), eq(copies.active, true)))
    .limit(1);
  if (!copy) return fail("No active copy found.");

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return fail("Not signed in.");

  const valueCents = computeCopyValueCents({
    slug: copy.traderSlug,
    amountCents: copy.amountCents,
    stopLossPct: copy.stopLossPct,
    startedAt: copy.startedAt,
  });

  await db.update(copies).set({ active: false, stoppedAt: new Date() }).where(eq(copies.id, copy.id));
  await db.update(users).set({ cashCents: user.cashCents + valueCents }).where(eq(users.id, userId));
  await db.insert(activity).values({
    userId,
    text: `Stopped copying ${traderSlug} — $${Math.round(valueCents / 100).toLocaleString()} returned to cash`,
  });

  return { ok: true, valueCents };
}
