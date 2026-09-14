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

/** A one-off scheduled test "blow" — fires the next time the engine is
 * lazily read (no cron on this stack) once now() passes `at`. */
export async function setBlowSchedule(db: AppDb, at: number, email: string | null): Promise<void> {
  await db
    .insert(platformSettings)
    .values({ id: SETTINGS_ID, blowScheduleAt: new Date(at), blowScheduleEmail: email })
    .onConflictDoUpdate({ target: platformSettings.id, set: { blowScheduleAt: new Date(at), blowScheduleEmail: email, updatedAt: new Date() } });
}

export async function getBlowSchedule(db: AppDb): Promise<{ at: number; email: string | null } | null> {
  const [row] = await db
    .select({ blowScheduleAt: platformSettings.blowScheduleAt, blowScheduleEmail: platformSettings.blowScheduleEmail })
    .from(platformSettings)
    .where(eq(platformSettings.id, SETTINGS_ID))
    .limit(1);
  if (!row?.blowScheduleAt) return null;
  return { at: row.blowScheduleAt.getTime(), email: row.blowScheduleEmail };
}

export async function clearBlowSchedule(db: AppDb): Promise<void> {
  await db
    .insert(platformSettings)
    .values({ id: SETTINGS_ID, blowScheduleAt: null, blowScheduleEmail: null })
    .onConflictDoUpdate({ target: platformSettings.id, set: { blowScheduleAt: null, blowScheduleEmail: null, updatedAt: new Date() } });
}

export async function getAutoBlowDays(db: AppDb): Promise<number> {
  const [row] = await db.select({ autoBlowDays: platformSettings.autoBlowDays }).from(platformSettings).where(eq(platformSettings.id, SETTINGS_ID)).limit(1);
  return row?.autoBlowDays ?? 0;
}

export async function setAutoBlowDays(db: AppDb, days: number): Promise<{ ok: true; autoBlowDays: number } | { ok: false; error: string }> {
  if (!Number.isFinite(days) || days < 0) return { ok: false, error: "Auto-blow days must be 0 or more." };
  await db
    .insert(platformSettings)
    .values({ id: SETTINGS_ID, autoBlowDays: days })
    .onConflictDoUpdate({ target: platformSettings.id, set: { autoBlowDays: days, updatedAt: new Date() } });
  return { ok: true, autoBlowDays: days };
}
