import { eq } from "drizzle-orm";
import { platformSettings } from "@/db/schema";
import type { AppDb } from "@/db/types";

const SETTINGS_ID = "singleton";
export const DEFAULT_WIN_RATE_PCT = 55;
export const DEFAULT_RISK_PCT = 50;

export async function getWinRatePct(db: AppDb): Promise<number> {
  const [row] = await db.select({ winRatePct: platformSettings.winRatePct }).from(platformSettings).where(eq(platformSettings.id, SETTINGS_ID)).limit(1);
  return row?.winRatePct ?? DEFAULT_WIN_RATE_PCT;
}

export async function setWinRatePct(db: AppDb, pct: number): Promise<{ ok: true; winRatePct: number } | { ok: false; error: string }> {
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) return { ok: false, error: "Win rate must be between 0 and 100." };
  const clamped = Math.round(pct);
  await db
    .insert(platformSettings)
    .values({ id: SETTINGS_ID, winRatePct: clamped })
    .onConflictDoUpdate({ target: platformSettings.id, set: { winRatePct: clamped, updatedAt: new Date() } });
  return { ok: true, winRatePct: clamped };
}

/** % of the allocation risked (used as illustrative position size) per
 * trade — the direct control for "trades barely move the balance." */
export async function getRiskPct(db: AppDb): Promise<number> {
  const [row] = await db.select({ riskPct: platformSettings.riskPct }).from(platformSettings).where(eq(platformSettings.id, SETTINGS_ID)).limit(1);
  return row?.riskPct ?? DEFAULT_RISK_PCT;
}

export async function setRiskPct(db: AppDb, pct: number): Promise<{ ok: true; riskPct: number } | { ok: false; error: string }> {
  if (!Number.isFinite(pct) || pct < 1 || pct > 100) return { ok: false, error: "Risk per trade must be between 1 and 100." };
  const clamped = Math.round(pct);
  await db
    .insert(platformSettings)
    .values({ id: SETTINGS_ID, riskPct: clamped })
    .onConflictDoUpdate({ target: platformSettings.id, set: { riskPct: clamped, updatedAt: new Date() } });
  return { ok: true, riskPct: clamped };
}
