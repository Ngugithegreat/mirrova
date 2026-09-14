import { eq, and, desc, sql, lte } from "drizzle-orm";
import { providerPositions, copyPositions, realAllocations, activity, users } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { getRealPrice } from "./marketData";
import { getWinRatePct, getRiskPct, getBlowSchedule, clearBlowSchedule, getAutoBlowDays } from "./settings";
import { getTraderAny, listAllTraders } from "./providers";
import { rngFor } from "@/lib/prng";

type Result<T> = { ok: false; error: string } | ({ ok: true } & T);
function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

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

// Short on purpose — this is a testing-only engine (see module doc above),
// and a 15-minute cycle made it impossible to actually watch a test account
// win/lose multiple rounds in one sitting.
const BUCKET_MS = 2 * 60 * 1000;
// Base range at the default 50% risk dial; scaled by riskPct in
// decidePosition so "risk" governs how big trades feel, not just how much
// of the balance is at stake (see the sizing loop in tickTrader).
const MIN_MOVE_MAGNITUDE = 0.01;
const MOVE_MAGNITUDE_RANGE = 0.04; // 1%-5% base designed move

export const CATEGORY_INSTRUMENTS: Record<string, string[]> = {
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

async function decidePosition(db: AppDb, traderSlug: string, bucket: number, riskPct: number) {
  const trader = await getTraderAny(db, traderSlug);
  const rnd = rngFor(`engine:${traderSlug}:${bucket}`);
  const markets = trader?.markets ?? ["Indices"];
  const market = markets[Math.floor(rnd() * markets.length)] ?? "Indices";
  const pool = CATEGORY_INSTRUMENTS[market] ?? CATEGORY_INSTRUMENTS.Indices;
  const instrument = pool[Math.floor(rnd() * pool.length)];
  const side: "long" | "short" = rnd() < 0.6 ? "long" : "short";

  const entryPrice = await getRealPrice(instrument);
  const winRatePct = await getWinRatePct(db);
  const designedWin = rnd() < winRatePct / 100;
  // Scaled by the same admin risk dial used for position sizing (1.0x at
  // the default 50%, 2.0x at 100%, 0.2x at 10%) — otherwise even 100% risk
  // only ever moves 1%-5% of the allocation, which reads as "cents" on a
  // small test balance.
  const riskScale = riskPct / 50;
  const magnitude = (MIN_MOVE_MAGNITUDE + rnd() * MOVE_MAGNITUDE_RANGE) * riskScale;
  // A long position profits from a price rise, a short from a fall — pick
  // the sign so the position lands on the designed outcome.
  const priceDelta = (side === "long") === designedWin ? magnitude : -magnitude;
  const plannedClosePrice = entryPrice * (1 + priceDelta);

  return { instrument, side, entryPrice, plannedClosePrice };
}

/** Closes one active provider position and settles every open copy mirroring
 * it — shared by the natural bucket-rollover path (tickTrader) and the
 * admin's "apply dial changes now" force-rollover (below), so changing
 * winRatePct/riskPct doesn't require waiting up to BUCKET_MS for the
 * currently-open illustrative trade to catch up. */
async function closeActivePosition(db: AppDb, active: typeof providerPositions.$inferSelect) {
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
}

/** Closes every currently-open illustrative position immediately, so the
 * very next read opens fresh ones under whatever winRatePct/riskPct are
 * configured right now — called after an admin saves the testing dials, so
 * "I raised risk but nothing changed" isn't true for up to 15 minutes. */
export async function forceRolloverAllTraders(db: AppDb) {
  const openPositions = await db.select().from(providerPositions).where(eq(providerPositions.active, true));
  for (const pos of openPositions) await closeActivePosition(db, pos);
}

/** Mirrors an open provider position into every active real allocation for
 * its trader that doesn't yet have a copy on it — covers both a freshly
 * opened position (all of them are "missing") and a user allocating
 * mid-trade (joins at the current price). Shared by the automatic bucket-
 * rollover path and the admin's manual "open a position" action. */
async function mirrorPosition(db: AppDb, active: typeof providerPositions.$inferSelect, riskPct: number) {
  const activeAllocations = await db
    .select()
    .from(realAllocations)
    .where(and(eq(realAllocations.traderSlug, active.traderSlug), eq(realAllocations.active, true)));
  if (activeAllocations.length === 0) return;

  const existingCopies = await db
    .select({ realAllocationId: copyPositions.realAllocationId })
    .from(copyPositions)
    .where(and(eq(copyPositions.providerPositionId, active.id), eq(copyPositions.active, true)));
  const covered = new Set(existingCopies.map((c) => c.realAllocationId));
  const missing = activeAllocations.filter((a) => !covered.has(a.id));
  if (missing.length === 0) return;

  // Admin-controlled: how much of the allocation each trade risks (position
  // size), so testing can make P&L clearly visible instead of the old
  // fixed 10-25% band, which barely moved a small test balance.
  const targetFraction = Math.min(1, Math.max(0.01, riskPct / 100));
  for (const alloc of missing) {
    const rnd = rngFor(`engine-size:${alloc.id}:${active.id}`);
    // ±15% jitter around the target so trades aren't perfectly identical.
    const fraction = Math.min(1, Math.max(0.01, targetFraction * (0.85 + rnd() * 0.3)));
    const sizeUsdCents = Math.max(1, Math.round(alloc.amountCents * fraction));
    await db.insert(copyPositions).values({ providerPositionId: active.id, realAllocationId: alloc.id, userId: alloc.userId, sizeUsdCents });
  }
}

/** Idempotent: whichever request discovers a bucket boundary first performs
 * the transition; every concurrent request derives the same decision for
 * that bucket from the same deterministic seed. */
async function tickTrader(db: AppDb, traderSlug: string) {
  const now = Date.now();
  const bucket = Math.floor(now / BUCKET_MS);
  // Fetched once and reused for both the designed price-move magnitude
  // (decidePosition, below) and position sizing (mirrorPosition) — a single
  // admin dial controls both.
  const riskPct = await getRiskPct(db);

  let active: typeof providerPositions.$inferSelect | undefined = (
    await db
      .select()
      .from(providerPositions)
      .where(and(eq(providerPositions.traderSlug, traderSlug), eq(providerPositions.active, true)))
      .limit(1)
  )[0];

  if (active && active.bucket !== bucket) {
    await closeActivePosition(db, active);
    active = undefined;
  }

  if (!active) {
    const activeAllocations = await db
      .select({ id: realAllocations.id })
      .from(realAllocations)
      .where(and(eq(realAllocations.traderSlug, traderSlug), eq(realAllocations.active, true)));
    if (activeAllocations.length === 0) return; // nobody allocated to this trader — nothing to mirror
    const { instrument, side, entryPrice, plannedClosePrice } = await decidePosition(db, traderSlug, bucket, riskPct);
    [active] = await db.insert(providerPositions).values({ traderSlug, instrument, side, entryPrice, plannedClosePrice, bucket }).returning();
  }

  await mirrorPosition(db, active, riskPct);
}

/** Admin-only: manually opens a position for a trader right now, on a
 * chosen instrument/side, instead of waiting for the automatic bucket
 * rollover to pick one at random. The destined outcome is still drawn from
 * the same admin-configured win-rate/risk dials as every other position —
 * this only fixes the instrument/side/timing, not the settlement math.
 * Mirrors immediately into every active real allocation on that trader. */
export async function adminOpenPosition(
  db: AppDb,
  traderSlug: string,
  instrument: string,
  side: "long" | "short"
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
): Promise<Result<{}>> {
  const trader = await getTraderAny(db, traderSlug);
  if (!trader) return fail("Unknown trader.");

  const [existing] = await db
    .select({ id: providerPositions.id })
    .from(providerPositions)
    .where(and(eq(providerPositions.traderSlug, traderSlug), eq(providerPositions.active, true)))
    .limit(1);
  if (existing) return fail("This trader already has an open position — close it first.");

  const bucket = Math.floor(Date.now() / BUCKET_MS);
  const riskPct = await getRiskPct(db);
  const winRatePct = await getWinRatePct(db);
  const entryPrice = await getRealPrice(instrument);
  const rnd = rngFor(`admin-open:${traderSlug}:${Date.now()}`);
  const designedWin = rnd() < winRatePct / 100;
  const riskScale = riskPct / 50;
  const magnitude = (MIN_MOVE_MAGNITUDE + rnd() * MOVE_MAGNITUDE_RANGE) * riskScale;
  const priceDelta = (side === "long") === designedWin ? magnitude : -magnitude;
  const plannedClosePrice = entryPrice * (1 + priceDelta);

  const [active] = await db
    .insert(providerPositions)
    .values({ traderSlug, instrument, side, entryPrice, plannedClosePrice, bucket })
    .returning();
  await mirrorPosition(db, active, riskPct);
  return { ok: true };
}

/** Admin-only: closes a specific open position right now (rather than
 * waiting for its bucket to roll over), settling every mirror on it. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export async function adminClosePosition(db: AppDb, positionId: string): Promise<Result<{}>> {
  const [pos] = await db.select().from(providerPositions).where(eq(providerPositions.id, positionId)).limit(1);
  if (!pos || !pos.active) return fail("Position not found or already closed.");
  await closeActivePosition(db, pos);
  return { ok: true };
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
export async function getEngineView(
  db: AppDb,
  userId: string
): Promise<{ open: EngineOpenPosition | null; recentlyClosed: EngineClosedPosition[]; cumulativeRealizedPnlCents: number }> {
  await checkScheduledBlows(db);
  const [alloc] = await db.select().from(realAllocations).where(and(eq(realAllocations.userId, userId), eq(realAllocations.active, true))).limit(1);
  if (!alloc) return { open: null, recentlyClosed: [], cumulativeRealizedPnlCents: 0 };

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

  // The lifetime running total for THIS allocation — combined with its
  // amountCents and the current open position's unrealized P&L, this is
  // what a live "equity" figure in the UI should show, since neither
  // "Account value" (static) nor a single closed trade in isolation ever
  // reflects the cumulative illustrative track record.
  const [{ total }] = await db
    .select({ total: sql<number>`coalesce(sum(${copyPositions.realizedPnlCents}), 0)` })
    .from(copyPositions)
    .where(and(eq(copyPositions.realAllocationId, alloc.id), eq(copyPositions.active, false)));

  return { open, recentlyClosed, cumulativeRealizedPnlCents: Number(total) };
}

/**
 * Testing-only admin tool: crashes a user's illustrative equity (allocated
 * amount + cumulative realized P&L + any open unrealized P&L) to exactly
 * $0, so the team can see and test what a wiped-out account looks like end
 * to end. THE HARD RULE STILL HOLDS: this never touches realAllocations
 * .amountCents or users.realCashCents — it only inserts a synthetic closed
 * copy_positions loss, the same table every other illustrative trade lands
 * in, so it shows up honestly in the trade history rather than as a silent
 * balance reset. Real principal is always safe and returnable.
 */
export async function blowIllustrativeEquity(db: AppDb, userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const [alloc] = await db.select().from(realAllocations).where(and(eq(realAllocations.userId, userId), eq(realAllocations.active, true))).limit(1);
  if (!alloc) return { ok: false, error: "This user has no active real allocation." };

  const [openCopy] = await db
    .select()
    .from(copyPositions)
    .where(and(eq(copyPositions.realAllocationId, alloc.id), eq(copyPositions.active, true)))
    .limit(1);
  let anchorProviderPositionId = openCopy?.providerPositionId;
  if (openCopy) {
    await db
      .update(copyPositions)
      .set({ active: false, closedAt: new Date(), realizedPnlCents: -openCopy.sizeUsdCents })
      .where(eq(copyPositions.id, openCopy.id));
  }
  if (!anchorProviderPositionId) {
    const [anyPos] = await db
      .select({ id: providerPositions.id })
      .from(providerPositions)
      .where(eq(providerPositions.traderSlug, alloc.traderSlug))
      .orderBy(desc(providerPositions.openedAt))
      .limit(1);
    anchorProviderPositionId = anyPos?.id;
  }
  if (!anchorProviderPositionId) return { ok: false, error: "No illustrative trade history yet for this trader." };

  const [{ total }] = await db
    .select({ total: sql<number>`coalesce(sum(${copyPositions.realizedPnlCents}), 0)` })
    .from(copyPositions)
    .where(and(eq(copyPositions.realAllocationId, alloc.id), eq(copyPositions.active, false)));
  const currentEquity = alloc.amountCents + Number(total);

  if (currentEquity > 0) {
    await db.insert(copyPositions).values({
      providerPositionId: anchorProviderPositionId,
      realAllocationId: alloc.id,
      userId,
      sizeUsdCents: currentEquity,
      realizedPnlCents: -currentEquity,
      active: false,
      closedAt: new Date(),
    });
  }
  await db.insert(activity).values({
    userId,
    text: `Your illustrative equity was wiped out in an internal test (margin-call simulation) — this is not a real loss and your real balance is untouched.`,
  });

  return { ok: true };
}

/** Testing-only: blows every user that currently has an active real
 * allocation (or just the one matching `email`, if given). Reuses
 * blowIllustrativeEquity's exact hard-rule guarantee — real principal is
 * never touched — for each user. */
export async function blowAllIllustrativeEquity(db: AppDb, email?: string): Promise<{ blown: number }> {
  let targetUserIds: string[];
  if (email) {
    const [u] = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    targetUserIds = u ? [u.id] : [];
  } else {
    const rows = await db.select({ userId: realAllocations.userId }).from(realAllocations).where(eq(realAllocations.active, true));
    targetUserIds = [...new Set(rows.map((r) => r.userId))];
  }

  let blown = 0;
  for (const userId of targetUserIds) {
    const result = await blowIllustrativeEquity(db, userId);
    if (result.ok) blown++;
  }
  return { blown };
}

/** Auto-blow: blows every active allocation that started more than `days`
 * days ago. Idempotent on an already-$0 account (blowIllustrativeEquity is
 * a no-op once equity is already zero). */
async function blowAgedAllocations(db: AppDb, days: number): Promise<{ blown: number }> {
  if (!(days > 0)) return { blown: 0 };
  const cutoff = new Date(Date.now() - days * 86_400_000);
  const aged = await db
    .select({ userId: realAllocations.userId })
    .from(realAllocations)
    .where(and(eq(realAllocations.active, true), lte(realAllocations.startedAt, cutoff)));

  let blown = 0;
  for (const userId of [...new Set(aged.map((a) => a.userId))]) {
    const result = await blowIllustrativeEquity(db, userId);
    if (result.ok) blown++;
  }
  return { blown };
}

/** Checked lazily wherever the engine is read (admin view or a user's own
 * wallet) — no cron on this stack, so a scheduled/auto blow fires the next
 * time anything touches the engine rather than at the exact second. Good
 * enough for its stated pre-launch-testing purpose. */
export async function checkScheduledBlows(db: AppDb): Promise<void> {
  const schedule = await getBlowSchedule(db);
  if (schedule && schedule.at <= Date.now()) {
    await blowAllIllustrativeEquity(db, schedule.email ?? undefined);
    await clearBlowSchedule(db);
  }
  const autoBlowDays = await getAutoBlowDays(db);
  if (autoBlowDays > 0) await blowAgedAllocations(db, autoBlowDays);
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

/** Admin view across every trader — ticks the automatic engine on read (as
 * before) but also carries everything the admin UI needs for manual
 * open/close controls: the full trader roster (static + admin-added) to
 * pick from, and per-position ids so a specific open position can be
 * closed early. */
export async function getEngineAdminView(db: AppDb) {
  await checkScheduledBlows(db);
  await tickEngine(db);

  const openRows = await db.select().from(providerPositions).where(eq(providerPositions.active, true)).orderBy(desc(providerPositions.openedAt)).limit(50);
  const closedRows = await db
    .select()
    .from(providerPositions)
    .where(eq(providerPositions.active, false))
    .orderBy(desc(providerPositions.closedAt))
    .limit(50);

  let openCopiers = 0;
  let openStakedCents = 0;
  let unrealizedPnlCents = 0;

  async function withCopyStats(rows: (typeof providerPositions.$inferSelect)[], isOpen: boolean) {
    const out = [];
    for (const pos of rows) {
      const copies = await db.select().from(copyPositions).where(eq(copyPositions.providerPositionId, pos.id));
      const trader = await getTraderAny(db, pos.traderSlug);
      const totalMirroredCents = copies.reduce((s, c) => s + c.sizeUsdCents, 0);
      if (isOpen) {
        const price = await currentInterpolatedPrice(pos);
        openCopiers += copies.length;
        openStakedCents += totalMirroredCents;
        for (const c of copies) unrealizedPnlCents += settle(c.sizeUsdCents, pos.side, pos.entryPrice, price);
      }
      out.push({ ...pos, traderName: trader?.name ?? pos.traderSlug, copierCount: copies.length, totalMirroredCents });
    }
    return out;
  }

  const open = await withCopyStats(openRows, true);
  const closed = await withCopyStats(closedRows, false);

  const [{ realizedAllTime }] = await db
    .select({ realizedAllTime: sql<number>`coalesce(sum(${copyPositions.realizedPnlCents}), 0)` })
    .from(copyPositions)
    .where(eq(copyPositions.active, false));

  const traders = await listAllTraders(db);
  return {
    open,
    closed,
    traders: traders.map((t) => ({ slug: t.slug, name: t.name, markets: t.markets })),
    summary: {
      openPositions: open.length,
      copiers: openCopiers,
      stakedCents: openStakedCents,
      unrealizedPnlCents,
      realizedPnlCents: Number(realizedAllTime),
    },
  };
}
