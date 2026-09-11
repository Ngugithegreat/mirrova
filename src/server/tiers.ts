import { eq, and, sql } from "drizzle-orm";
import { payments } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { tierForDeposits, type Tier } from "@/lib/tiers";

/** A tier is computed live from lifetime completed deposits — never stored,
 * so there is nothing to keep in sync or drift out of date. */
export async function getUserTier(db: AppDb, userId: string): Promise<{ tier: Tier; totalDepositedUsdCents: number }> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${payments.creditedUsdCents}), 0)` })
    .from(payments)
    .where(and(eq(payments.userId, userId), eq(payments.status, "completed")));

  const totalDepositedUsdCents = Number(row?.total ?? 0);
  return { tier: tierForDeposits(totalDepositedUsdCents), totalDepositedUsdCents };
}
