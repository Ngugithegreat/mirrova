import { eq, and, desc } from "drizzle-orm";
import { providerPositions, copyPositions, realAllocations } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { getRealPrice } from "./marketData";
import { getWinRatePct, getRiskPct } from "./settings";
import { getTrader } from "@/lib/traders";
import { rngFor } from "@/lib/prng";

/**
 * Illustrative-only trade-execution engine: opens/closes a "current trade"
 * per trader on a fixed time bucket, lazily on read (no cron — same
 * philosophy as desk.ts's SL/TP auto-close), and mirrors a sized position
 * into copy_positions for every real allocation on that trader. THE HARD
 * RULE: none of this ever touches realAllocations.amountCents or
 * users.realCashCents — allocateReal/deallocateReal are untouched.
 *
 * Outcomes are engineered, not left to real price movement: the entry price
 * still mirrors the live current rate (getRealPrice), but the destined close
 * price is pre-computed at open time from the admin-configured testing win
 * rate (src/server/settings.ts) so the team can dial the whole system's win
 * rate to 0-100% for end-to-end loss/profit scenario testing. This is a
 * testing-only mechanism, removed before any real settlement ever ships.
 */

const BUCKET_MS = 15 * 60 * 1000;
const MIN_MOVE_MAGNITUDE = 0.003;
const MOVE_MAGNITUDE_RANGE = 0.027; // 0.3%-3% designed move

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

/** The price interpolated toward the pre-computed destined close, by how far
 * through the bucket we are — so unrealized P&L moves believably tick to
 * tick instead of jumping straight to the designed answer. Falls back to a
 * fresh real-price fetch for any pre-existing row with no planned close. */
async function currentInterpolatedPrice(pos: typeof providerPositions.$inferSelect): Promise<number> {
  if (pos.plannedClosePrice == null) return getRealPrice(pos.instrument);
  const bucketStart = pos.bucket * BUCKET_MS;
  const progress = Math.min(1, Math.max(0, (Date.now() - bucketStart) / BUCKET_MS));
  const noiseSeed = rngFor(`engine-noise:${pos.id}:${Math.floor(Date.now() / 10_000)}`)();
  const noise = (noiseSeed - 0.5) * Math.abs(pos.plannedClosePrice - pos.entryPrice) * 0.15;
  return pos.entryPrice + (pos.plannedClosePrice - pos.entryPrice) * progress + noise;
}

async function decidePosition(db: AppDb, traderSlug: string, bucket: number) {
  const trader = getTrader(traderSlug);
  const rnd = rngFor(`engine:${traderSlug}:${bucket}`);
  const markets = trader?.markets ?? ["Indices"];
  const market = markets[Math.floor(rnd() * markets.length)] ?? "Indices";
  const pool = CATEGORY_INSTRUMENTS[market] ?? CATEGORY_INSTRUMENTS.Indices;
  const instrument = pool[Math.floor(rnd() * pool.length)];
  const side: "long" | "short" = rnd() < 0.6 ? "long" : "short";

  const entryPrice = await getRealPrice(instrument);
  const winRatePct = await getWinRatePct(db);
  const designedWin = rnd() < winRatePct / 100;
  const magnitude = MIN_MOVE_MAGNITUDE + rnd() * MOVE_MAGNITUDE_RANGE;
  // A long position profits from a price rise, a short from a fall — pick
  // the sign so the position lands on the designed outcome.
  const priceDelta = (side === "long") === designedWin ? magnitude : -magnitude;
  const plannedClosePrice = entryPrice * (1 + priceDelta);

  return { instrument, side, entryPrice, plannedClosePrice };
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
    const closePrice = active.plannedClosePrice ?? (await getRealPrice(active.instrument));
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
    const { instrument, side, entryPrice, plannedClosePrice } = await decidePosition(db, traderSlug, bucket);
    [active] = await db.insert(providerPositions).values({ traderSlug, instrument, side, entryPrice, plannedClosePrice, bucket }).returning();
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

  if (missing.length > 0) {
    // Admin-controlled: how much of the allocation each trade risks (position
    // size), so testing can make P&L clearly visible instead of the old
    // fixed 10-25% band, which barely moved a small test balance.
    const riskPct = await getRiskPct(db);
    const targetFraction = Math.min(1, Math.max(0.01, riskPct / 100));
    for (const alloc of missing) {
      const rnd = rngFor(`engine-size:${alloc.id}:${active.id}`);
      // ±15% jitter around the target so trades aren't perfectly identical.
      const fraction = Math.min(1, Math.max(0.01, targetFraction * (0.85 + rnd() * 0.3)));
      const sizeUsdCents = Math.max(1, Math.round(alloc.amountCents * fraction));
      await db.insert(copyPositions).values({ providerPositionId: active.id, realAllocationId: alloc.id, userId: alloc.userId, sizeUsdCents });
    }
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
      const price = await currentInterpolatedPrice(pos);
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
