import { getTrader, traderStats } from "./traders";
import { rngFor } from "./prng";

/**
 * Deterministic mark-to-market for a copy relationship, in cents. Isomorphic:
 * used client-side for optimistic display and — authoritatively — server-side
 * when a copy is stopped and settled. Never trust a client-supplied value for
 * the actual settlement; always recompute it here from the stored inputs.
 */
export function computeCopyValueCents(params: {
  slug: string;
  amountCents: number;
  stopLossPct: number;
  startedAt: Date | string | number;
}): number {
  const t = getTrader(params.slug);
  if (!t) return params.amountCents;

  const s = traderStats(t);
  const startedMs =
    params.startedAt instanceof Date
      ? params.startedAt.getTime()
      : typeof params.startedAt === "string"
        ? new Date(params.startedAt).getTime()
        : params.startedAt;

  const days = Math.max(0, (Date.now() - startedMs) / 86400000);
  const monthlyPace = s.return12m / 12 / 100;
  const dayIndex = Math.floor(startedMs / 86400000 + days);
  const noise = (rngFor(`nav:${params.slug}:${dayIndex}`)() - 0.5) * 0.02;
  const growth = Math.pow(1 + monthlyPace, days / 30.44) * (1 + noise * Math.min(days, 1));
  const floor = 1 - params.stopLossPct / 100;

  return Math.round(params.amountCents * Math.max(growth, floor));
}
