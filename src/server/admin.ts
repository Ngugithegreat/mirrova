import { eq, and, desc, sql, or, ilike, inArray } from "drizzle-orm";
import { users, payments, copies, realAllocations, deskPositions } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { getUserTier } from "./tiers";
import { reconcileDeposit } from "./realAccount";
import { tierForDeposits, type TierId } from "@/lib/tiers";
import { getTrader } from "@/lib/traders";

const USER_LIST_LIMIT = 200;
const ROW_LIMIT = 100;

export async function getOverview(db: AppDb) {
  const [userCount] = await db.select({ n: sql<number>`count(*)` }).from(users);
  const [depositTotal] = await db
    .select({ n: sql<number>`coalesce(sum(${payments.creditedUsdCents}),0)` })
    .from(payments)
    .where(eq(payments.status, "completed"));
  const [cashTotal] = await db.select({ n: sql<number>`coalesce(sum(${users.cashCents}),0)` }).from(users);
  const activeCopies = await db.select({ id: copies.id }).from(copies).where(eq(copies.active, true));
  const activeAllocations = await db
    .select({ amountCents: realAllocations.amountCents })
    .from(realAllocations)
    .where(eq(realAllocations.active, true));
  const openDesk = await db.select({ id: deskPositions.id }).from(deskPositions).where(eq(deskPositions.active, true));

  const perUserDeposits = await db
    .select({ userId: payments.userId, total: sql<number>`coalesce(sum(${payments.creditedUsdCents}),0)` })
    .from(payments)
    .where(eq(payments.status, "completed"))
    .groupBy(payments.userId);

  const tierCounts: Record<TierId, number> = { core: 0, momentum: 0, apex: 0 };
  const depositedUserIds = new Set<string>();
  for (const row of perUserDeposits) {
    depositedUserIds.add(row.userId);
    tierCounts[tierForDeposits(Number(row.total)).id]++;
  }
  tierCounts.core += Number(userCount?.n ?? 0) - depositedUserIds.size;

  return {
    totalUsers: Number(userCount?.n ?? 0),
    totalDepositedUsdCents: Number(depositTotal?.n ?? 0),
    totalPracticeCashCents: Number(cashTotal?.n ?? 0),
    activeCopiesCount: activeCopies.length,
    activeAllocationsCount: activeAllocations.length,
    activeAllocationsTotalCents: activeAllocations.reduce((s, a) => s + a.amountCents, 0),
    openDeskCount: openDesk.length,
    tierCounts,
  };
}

export async function getUsersList(db: AppDb, q?: string) {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      cashCents: users.cashCents,
      realCashCents: users.realCashCents,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(q ? or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`)) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(USER_LIST_LIMIT);

  const out = [];
  for (const u of rows) {
    const { tier, totalDepositedUsdCents } = await getUserTier(db, u.id);
    const [{ n: activeCopyCount }] = await db
      .select({ n: sql<number>`count(*)` })
      .from(copies)
      .where(and(eq(copies.userId, u.id), eq(copies.active, true)));
    const [activeAlloc] = await db
      .select({ traderSlug: realAllocations.traderSlug, amountCents: realAllocations.amountCents })
      .from(realAllocations)
      .where(and(eq(realAllocations.userId, u.id), eq(realAllocations.active, true)))
      .limit(1);
    const [{ n: openDeskCount }] = await db
      .select({ n: sql<number>`count(*)` })
      .from(deskPositions)
      .where(and(eq(deskPositions.userId, u.id), eq(deskPositions.active, true)));

    out.push({
      ...u,
      tier: tier.id,
      totalDepositedUsdCents,
      activeCopyCount: Number(activeCopyCount ?? 0),
      realAllocation: activeAlloc ?? null,
      openDeskCount: Number(openDeskCount ?? 0),
    });
  }
  return out;
}

async function usersById(db: AppDb, ids: string[]) {
  if (ids.length === 0) return new Map();
  const rows = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, ids));
  return new Map(rows.map((u) => [u.id, u]));
}

export async function getDepositsList(db: AppDb, status?: string) {
  const rows = await db
    .select()
    .from(payments)
    .where(status ? eq(payments.status, status) : undefined)
    .orderBy(desc(payments.createdAt))
    .limit(ROW_LIMIT);

  const userMap = await usersById(db, [...new Set(rows.map((r) => r.userId))]);
  const totals = await db
    .select({ status: payments.status, total: sql<number>`coalesce(sum(${payments.creditedUsdCents}),0)`, count: sql<number>`count(*)` })
    .from(payments)
    .groupBy(payments.status);

  return {
    deposits: rows.map((r) => ({ ...r, user: userMap.get(r.userId) ?? null })),
    totals: totals.map((t) => ({ status: t.status, totalUsdCents: Number(t.total), count: Number(t.count) })),
  };
}

export { reconcileDeposit };

export async function getActivityList(db: AppDb) {
  const activeCopiesRows = await db.select().from(copies).where(eq(copies.active, true)).orderBy(desc(copies.startedAt)).limit(ROW_LIMIT);
  const activeAllocRows = await db
    .select()
    .from(realAllocations)
    .where(eq(realAllocations.active, true))
    .orderBy(desc(realAllocations.startedAt))
    .limit(ROW_LIMIT);

  const userMap = await usersById(db, [...new Set([...activeCopiesRows.map((c) => c.userId), ...activeAllocRows.map((a) => a.userId)])]);

  return {
    copies: activeCopiesRows.map((c) => ({
      ...c,
      user: userMap.get(c.userId) ?? null,
      traderName: getTrader(c.traderSlug)?.name ?? c.traderSlug,
    })),
    realAllocations: activeAllocRows.map((a) => ({
      ...a,
      user: userMap.get(a.userId) ?? null,
      traderName: getTrader(a.traderSlug)?.name ?? a.traderSlug,
    })),
  };
}

export async function getDeskList(db: AppDb) {
  const openRows = await db.select().from(deskPositions).where(eq(deskPositions.active, true)).orderBy(desc(deskPositions.openedAt)).limit(ROW_LIMIT);
  const closedRows = await db
    .select()
    .from(deskPositions)
    .where(eq(deskPositions.active, false))
    .orderBy(desc(deskPositions.closedAt))
    .limit(50);

  const userMap = await usersById(db, [...new Set([...openRows, ...closedRows].map((p) => p.userId))]);

  return {
    open: openRows.map((p) => ({ ...p, user: userMap.get(p.userId) ?? null })),
    closed: closedRows.map((p) => ({ ...p, user: userMap.get(p.userId) ?? null })),
  };
}
