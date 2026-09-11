import { eq, and, sql } from "drizzle-orm";
import { users, payments } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { getAccountType, type AccountTypeId } from "@/lib/accountTypes";

export async function getUserAccountType(db: AppDb, userId: string) {
  const [user] = await db.select({ accountType: users.accountType }).from(users).where(eq(users.id, userId)).limit(1);
  return getAccountType(user?.accountType);
}

/** Lifetime completed real deposits — used to gate real allocation and
 * account-type switching, not to auto-assign a type anymore. */
export async function getTotalDeposited(db: AppDb, userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${payments.creditedUsdCents}), 0)` })
    .from(payments)
    .where(and(eq(payments.userId, userId), eq(payments.status, "completed")));
  return Number(row?.total ?? 0);
}

export async function setUserAccountType(db: AppDb, userId: string, accountTypeId: AccountTypeId) {
  await db.update(users).set({ accountType: accountTypeId }).where(eq(users.id, userId));
}
