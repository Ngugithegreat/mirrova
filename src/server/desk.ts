import { eq, and, desc } from "drizzle-orm";
import { users, deskPositions, activity } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { getInstrument, INSTRUMENTS } from "@/lib/instruments";
import { currentPrice } from "@/lib/deskMarket";
import { getUserTier } from "./tiers";

type Result<T> = { ok: false; error: string } | ({ ok: true } & T);
function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

const MIN_STAKE_CENTS = 1000; // $10
const MAX_STAKE_CENTS = 50_000 * 100; // $50,000

function unlockedInstruments(count: number) {
  return INSTRUMENTS.slice(0, count).map((i) => i.sym);
}

/** Signed % move from entry, in the position's favor. */
function pnlPct(side: string, entryPrice: number, price: number) {
  const raw = (price - entryPrice) / entryPrice;
  return side === "short" ? -raw : raw;
}

function settle(pos: typeof deskPositions.$inferSelect, price: number) {
  const pct = pnlPct(pos.side, pos.entryPrice, price);
  const pnlCents = Math.round(pos.stakeUsdCents * pos.leverage * pct);
  // A leveraged practice loss can only ever cost the staked amount — never negative cash.
  return Math.max(pnlCents, -pos.stakeUsdCents);
}

export async function openPosition(
  db: AppDb,
  userId: string,
  instrument: string,
  side: "long" | "short",
  stakeUsdCents: number,
  stopLossPrice?: number,
  takeProfitPrice?: number
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
): Promise<Result<{}>> {
  const inst = getInstrument(instrument);
  if (!inst) return fail("Unknown instrument.");
  if (!Number.isFinite(stakeUsdCents) || stakeUsdCents < MIN_STAKE_CENTS || stakeUsdCents > MAX_STAKE_CENTS) {
    return fail(`Stake must be between $${MIN_STAKE_CENTS / 100} and $${(MAX_STAKE_CENTS / 100).toLocaleString()}.`);
  }

  const { tier } = await getUserTier(db, userId);
  if (!unlockedInstruments(tier.deskInstrumentCount).includes(instrument)) {
    return fail(`${instrument} unlocks at a higher tier.`);
  }
  if ((stopLossPrice != null || takeProfitPrice != null) && !tier.deskOrdersWithSlTp) {
    return fail(`Stop-loss and take-profit orders unlock at a higher tier.`);
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return fail("Not signed in.");
  if (stakeUsdCents > user.cashCents) return fail("Not enough available practice cash.");

  const entryPrice = currentPrice(instrument);

  if (stopLossPrice != null) {
    const sane = side === "long" ? stopLossPrice < entryPrice : stopLossPrice > entryPrice;
    if (!sane) return fail(`Stop-loss must be ${side === "long" ? "below" : "above"} the entry price.`);
  }
  if (takeProfitPrice != null) {
    const sane = side === "long" ? takeProfitPrice > entryPrice : takeProfitPrice < entryPrice;
    if (!sane) return fail(`Take-profit must be ${side === "long" ? "above" : "below"} the entry price.`);
  }

  await db.insert(deskPositions).values({
    userId,
    instrument,
    side,
    stakeUsdCents,
    leverage: tier.deskLeverage,
    entryPrice,
    stopLossPrice: stopLossPrice ?? null,
    takeProfitPrice: takeProfitPrice ?? null,
  });
  await db.update(users).set({ cashCents: user.cashCents - stakeUsdCents }).where(eq(users.id, userId));
  await db.insert(activity).values({
    userId,
    text: `Opened a ${side} Desk position on ${instrument} — $${(stakeUsdCents / 100).toLocaleString()} at ${tier.deskLeverage}× (practice)`,
  });

  return { ok: true };
}

async function autoCloseIfTriggered(db: AppDb, pos: typeof deskPositions.$inferSelect, price: number) {
  const hitSl =
    pos.stopLossPrice != null &&
    (pos.side === "long" ? price <= pos.stopLossPrice : price >= pos.stopLossPrice);
  const hitTp =
    pos.takeProfitPrice != null &&
    (pos.side === "long" ? price >= pos.takeProfitPrice : price <= pos.takeProfitPrice);
  if (!hitSl && !hitTp) return false;

  const pnlCents = settle(pos, price);
  await db
    .update(deskPositions)
    .set({ active: false, closedAt: new Date(), closePrice: price, pnlCents })
    .where(eq(deskPositions.id, pos.id));

  const [user] = await db.select().from(users).where(eq(users.id, pos.userId)).limit(1);
  if (user) {
    await db.update(users).set({ cashCents: user.cashCents + pos.stakeUsdCents + pnlCents }).where(eq(users.id, pos.userId));
  }
  await db.insert(activity).values({
    userId: pos.userId,
    text: `${hitTp ? "Take-profit" : "Stop-loss"} hit on ${pos.instrument} — ${pnlCents >= 0 ? "+" : "−"}$${Math.abs(pnlCents / 100).toFixed(2)} (practice)`,
  });
  return true;
}

export async function listPositions(db: AppDb, userId: string) {
  const rows = await db
    .select()
    .from(deskPositions)
    .where(and(eq(deskPositions.userId, userId), eq(deskPositions.active, true)));

  const open: Array<{ position: typeof deskPositions.$inferSelect; price: number; unrealizedPnlCents: number }> = [];
  for (const pos of rows) {
    const price = currentPrice(pos.instrument);
    const closed = await autoCloseIfTriggered(db, pos, price);
    if (!closed) {
      open.push({ position: pos, price, unrealizedPnlCents: settle(pos, price) });
    }
  }

  const closed = await db
    .select()
    .from(deskPositions)
    .where(and(eq(deskPositions.userId, userId), eq(deskPositions.active, false)))
    .orderBy(desc(deskPositions.closedAt))
    .limit(10);

  return { open, closed };
}

export async function closePosition(db: AppDb, userId: string, positionId: string): Promise<Result<{ pnlCents: number }>> {
  const [pos] = await db
    .select()
    .from(deskPositions)
    .where(and(eq(deskPositions.id, positionId), eq(deskPositions.userId, userId), eq(deskPositions.active, true)))
    .limit(1);
  if (!pos) return fail("No open position found.");

  const price = currentPrice(pos.instrument);
  const pnlCents = settle(pos, price);

  await db
    .update(deskPositions)
    .set({ active: false, closedAt: new Date(), closePrice: price, pnlCents })
    .where(eq(deskPositions.id, pos.id));

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user) {
    await db.update(users).set({ cashCents: user.cashCents + pos.stakeUsdCents + pnlCents }).where(eq(users.id, userId));
  }
  await db.insert(activity).values({
    userId,
    text: `Closed ${pos.side} Desk position on ${pos.instrument} — ${pnlCents >= 0 ? "+" : "−"}$${Math.abs(pnlCents / 100).toFixed(2)} (practice)`,
  });

  return { ok: true, pnlCents };
}
