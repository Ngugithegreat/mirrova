"use client";

/**
 * Client-side practice account. Everything lives in localStorage — this powers
 * the interactive product preview (signup, copying, dashboard) without a backend.
 */

import { useSyncExternalStore } from "react";
import { getTrader, traderStats } from "./traders";
import { rngFor } from "./prng";

export type CopyRelation = {
  slug: string;
  amount: number;
  stopLossPct: number; // e.g. 15 = liquidate at -15%
  startedAt: number; // epoch ms
};

export type DemoState = {
  user: { name: string; email: string } | null;
  cash: number;
  copies: CopyRelation[];
  activity: { at: number; text: string }[];
};

const KEY = "mirrova.demo.v1";
const START_CASH = 100000;

const EMPTY: DemoState = { user: null, cash: START_CASH, copies: [], activity: [] };

let cache: DemoState | null = null;
const listeners = new Set<() => void>();

function read(): DemoState {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache!;
}

function write(next: DemoState) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

export function useDemoState(): DemoState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => EMPTY
  );
}

export const demo = {
  signUp(name: string, email: string) {
    const s = read();
    write({
      ...s,
      user: { name, email },
      activity: [{ at: Date.now(), text: `Account created — $${START_CASH.toLocaleString()} practice balance funded` }, ...s.activity],
    });
  },
  logIn(email: string) {
    const s = read();
    const name = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Investor";
    write({ ...s, user: s.user ?? { name, email } });
  },
  logOut() {
    write({ ...read(), user: null });
  },
  startCopy(slug: string, amount: number, stopLossPct: number): "ok" | "insufficient" | "exists" {
    const s = read();
    if (s.copies.some((c) => c.slug === slug)) return "exists";
    if (amount > s.cash) return "insufficient";
    const t = getTrader(slug);
    write({
      ...s,
      cash: s.cash - amount,
      copies: [...s.copies, { slug, amount, stopLossPct, startedAt: Date.now() }],
      activity: [
        { at: Date.now(), text: `Started copying ${t?.name ?? slug} with $${amount.toLocaleString()} (stop-loss ${stopLossPct}%)` },
        ...s.activity,
      ],
    });
    return "ok";
  },
  stopCopy(slug: string) {
    const s = read();
    const rel = s.copies.find((c) => c.slug === slug);
    if (!rel) return;
    const value = copyValue(rel);
    const t = getTrader(slug);
    write({
      ...s,
      cash: s.cash + value,
      copies: s.copies.filter((c) => c.slug !== slug),
      activity: [
        { at: Date.now(), text: `Stopped copying ${t?.name ?? slug} — $${Math.round(value).toLocaleString()} returned to cash` },
        ...s.activity,
      ],
    });
  },
  reset() {
    write(EMPTY);
  },
};

/**
 * Deterministic mark-to-market for a copy relationship: drift from the trader's
 * recent monthly pace plus mild seeded day-to-day noise.
 */
export function copyValue(rel: CopyRelation): number {
  const t = getTrader(rel.slug);
  if (!t) return rel.amount;
  const s = traderStats(t);
  const days = Math.max(0, (Date.now() - rel.startedAt) / 86400000);
  const monthlyPace = s.return12m / 12 / 100;
  const dayIndex = Math.floor(rel.startedAt / 86400000 + days);
  const noise = (rngFor(`nav:${rel.slug}:${dayIndex}`)() - 0.5) * 0.02;
  const growth = Math.pow(1 + monthlyPace, days / 30.44) * (1 + noise * Math.min(days, 1));
  const floor = 1 - rel.stopLossPct / 100;
  return rel.amount * Math.max(growth, floor);
}
