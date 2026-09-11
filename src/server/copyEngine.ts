import { eq, and, desc } from "drizzle-orm";
import { providerPositions, copyPositions, realAllocations } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { getRealPrice } from "./marketData";
import { getTrader } from "@/lib/traders";
import { rngFor } from "@/lib/prng";

/**
 * Illustrative-only trade-execution engine: opens/closes a "current trade"
 * per trader on a fixed time bucket, lazily on read (no cron — same
 * philosophy as desk.ts's SL/TP auto-close), and mirrors a sized position
 * into copy_positions for every real allocation on that trader. THE HARD
 * RULE: none of this ever touches realAllocations.amountCents or
 * users.realCashCents — allocateReal/deallocateReal are untouched.
 */

const BUCKET_MS = 15 * 60 * 1000;
const MIN_SIZE_FRACTION = 0.1;
const SIZE_FRACTION_RANGE = 0.15; // 10%-25% of the allocation per trade

const CATEGORY_INSTRUMENTS: Record<string, string[]> = {
  Stocks: ["AAPL"],
  Crypto: ["BTC/USD", "ETH/USD"],
  Forex: ["EUR/USD", "GBP/USD", "USD/JPY"],
  Indices: ["S&P 500", "NASDAQ 100", "DAX 40"],
  Commodities: ["GOLD", "CRUDE OIL", "SILVER"],
};

/** Signed % move from entry, in the position's favor. */
export function pnlPct(side: string, entryPrice: number, price: number) {
  const raw = (price - entryPrice) / entryPrice;
  return side === "short" ? -raw : raw;
}

function settle(sizeUsdCents: number, side: string, entryPrice: number, price: number) {
  const pct = pnlPct(side, entryPrice, price);
  // Unleveraged (real copy allocations carry no per-user leverage setting) —
  // a loss can only ever cost the mirrored size, never more.
  return Math.max(Math.round(sizeUsdCents * pct), -sizeUsdCents);
}

function decidePosition(traderSlug: string, bucket: number) {
  const trader = getTrader(traderSlug);
  const rnd = rngFor(`engine:${traderSlug}:${bucket}`);
  const markets = trader?.markets ?? ["Indices"];
  const market = markets[Math.floor(rnd() * markets.length)] ?? "Indices";
  const pool = CATEGORY_INSTRUMENTS[market] ?? CATEGORY_INSTRUMENTS.Indices;
  const instrument = pool[Math.floor(rnd() * pool.length)];
  const side: "long" | "short" = rnd() < 0.6 ? "long" : "short";
  return { instrument, side };
}

/** Idempotent: whichever request discovers a bucket boundary first performs
 * the transition; every concurrent request derives the same decision for
 * that bucket from the same deterministic seed. */
async function tickTrader(db: AppDb, traderSlug: string) {
  const now = Date.now();
  const bucket = Math.floor(now / BUCKET_MS);

  let active: typeof providerPositions.$inferSelect | undefined = (
    await db
      .select()
      .from(providerPositions)
      .where(and(eq(providerPositions.traderSlug, traderSlug), eq(providerPositions.active, true)))
      .limit(1)
  )[0];

  if (active && active.bucket !== bucket) {
    const closePrice = await getRealPrice(active.instrument);
    await db
      .update(providerPositions)
      .set({ active: false, closedAt: new Date(), closePrice })
      .where(eq(providerPositions.id, active.id));

    const openCopies = await db
      .select()
      .from(copyPositions)
      .where(and(eq(copyPositions.providerPositionId, active.id), eq(copyPositions.active, true)));
    for (const cp of openCopies) {
      const realizedPnlCents = settle(cp.sizeUsdCents, active.side, active.entryPrice, closePrice);
      await db.update(copyPositions).set({ active: false, closedAt: new Date(), realizedPnlCents }).where(eq(copyPositions.id, cp.id));
    }
    active = undefined;
  }

  const activeAllocations = await db
    .select()
    .from(realAllocations)
    .where(and(eq(realAllocations.traderSlug, traderSlug), eq(realAllocations.active, true)));

  if (!active) {
    if (activeAllocations.length === 0) return; // nobody allocated to this trader — nothing to mirror
    const { instrument, side } = decidePosition(traderSlug, bucket);
    const entryPrice = await getRealPrice(instrument);
    [active] = await db.insert(providerPositions).values({ traderSlug, instrument, side, entryPrice, bucket }).returning();
  }

  // Mirror any allocation that doesn't yet have a copy on the currently
  // open position — covers both a freshly opened position (all of them are
  // "missing") and a user allocating mid-trade (joins at the current price).
  const existingCopies = await db
    .select({ realAllocationId: copyPositions.realAllocationId })
    .from(copyPositions)
    .where(and(eq(copyPositions.providerPositionId, active.id), eq(copyPositions.active, true)));
  const covered = new Set(existingCopies.map((c) => c.realAllocationId));
  const missing = activeAllocations.filter((a) => !covered.has(a.id));

  for (const alloc of missing) {
    const rnd = rngFor(`engine-size:${alloc.id}:${active.id}`);
    const fraction = MIN_SIZE_FRACTION + rnd() * SIZE_FRACTION_RANGE;
    const sizeUsdCents = Math.max(1, Math.round(alloc.amountCents * fraction));
    await db.insert(copyPositions).values({ providerPositionId: active.id, realAllocationId: alloc.id, userId: alloc.userId, sizeUsdCents });
  }
}

/** Ticks one trader, or every trader with at least one active real
 * allocation when no slug is given (the admin view needs the global
 * picture; a single user's wallet read only needs its own trader). */
export async function tickEngine(db: AppDb, traderSlug?: string) {
  if (traderSlug) {
    await tickTrader(db, traderSlug);
    return;
  }
  const rows = await db.selectDistinct({ traderSlug: realAllocations.traderSlug }).from(realAllocations).where(eq(realAllocations.active, true));
  for (const r of rows) await tickTrader(db, r.traderSlug);
}

export type EngineOpenPosition = {
  instrument: string;
  side: string;
  entryPrice: number;
  price: number;
  sizeUsdCents: number;
  unrealizedPnlCents: number;
  openedAt: Date;
};

export type EngineClosedPosition = {
  instrument: string;
  side: string;
  sizeUsdCents: number;
  realizedPnlCents: number;
  closedAt: Date | null;
};

/** For a single user's wallet view — ticks only their own trader (if they
 * have an active allocation) rather than the whole engine. */
export async function getEngineView(db: AppDb, userId: string): Promise<{ open: EngineOpenPosition | null; recentlyClosed: EngineClosedPosition[] }> {
  const [alloc] = await db.select().from(realAllocations).where(and(eq(realAllocations.userId, userId), eq(realAllocations.active, true))).limit(1);
  if (!alloc) return { open: null, recentlyClosed: [] };

  await tickEngine(db, alloc.traderSlug);

  let open: EngineOpenPosition | null = null;
  const [openCopy] = await db
    .select()
    .from(copyPositions)
    .where(and(eq(copyPositions.userId, userId), eq(copyPositions.active, true)))
    .limit(1);
  if (openCopy) {
    const [pos] = await db.select().from(providerPositions).where(eq(providerPositions.id, openCopy.providerPositionId)).limit(1);
    if (pos) {
      const price = await getRealPrice(pos.instrument);
      const unrealizedPnlCents = settle(openCopy.sizeUsdCents, pos.side, pos.entryPrice, price);
      open = {
        instrument: pos.instrument,
        side: pos.side,
        entryPrice: pos.entryPrice,
        price,
        sizeUsdCents: openCopy.sizeUsdCents,
        unrealizedPnlCents,
        openedAt: pos.openedAt,
      };
    }
  }

  const recentlyClosed = await listClosedCopyPositions(db, userId, 5);

  return { open, recentlyClosed };
}

/** Shared by getEngineView's compact widget (limit 5) and the Portfolio
 * analytics page, which wants a deeper history. */
export async function listClosedCopyPositions(db: AppDb, userId: string, limit = 5): Promise<EngineClosedPosition[]> {
  const closedRows = await db
    .select()
    .from(copyPositions)
    .where(and(eq(copyPositions.userId, userId), eq(copyPositions.active, false)))
    .orderBy(desc(copyPositions.closedAt))
    .limit(limit);
  const out: EngineClosedPosition[] = [];
  for (const cp of closedRows) {
    const [pos] = await db.select().from(providerPositions).where(eq(providerPositions.id, cp.providerPositionId)).limit(1);
    out.push({
      instrument: pos?.instrument ?? "—",
      side: pos?.side ?? "long",
      sizeUsdCents: cp.sizeUsdCents,
      realizedPnlCents: cp.realizedPnlCents ?? 0,
      closedAt: cp.closedAt,
    });
  }
  return out;
}

/** Read-only admin view across every trader — no manual open/close controls
 * since ticking is fully automatic. */
export async function getEngineAdminView(db: AppDb) {
  await tickEngine(db);

  const openRows = await db.select().from(providerPositions).where(eq(providerPositions.active, true)).orderBy(desc(providerPositions.openedAt)).limit(50);
  const closedRows = await db
    .select()
    .from(providerPositions)
    .where(eq(providerPositions.active, false))
    .orderBy(desc(providerPositions.closedAt))
    .limit(50);

  async function withCopyStats(rows: (typeof providerPositions.$inferSelect)[]) {
    const out = [];
    for (const pos of rows) {
      const copies = await db.select().from(copyPositions).where(eq(copyPositions.providerPositionId, pos.id));
      out.push({
        ...pos,
        traderName: getTrader(pos.traderSlug)?.name ?? pos.traderSlug,
        copierCount: copies.length,
        totalMirroredCents: copies.reduce((s, c) => s + c.sizeUsdCents, 0),
      });
    }
    return out;
  }

  return { open: await withCopyStats(openRows), closed: await withCopyStats(closedRows) };
}
