import { rngFor } from "./prng";
import type { Trader } from "./traders";

/**
 * Fabricates a "current position" per trader that rotates on a fixed time
 * bucket, so every strategist reads as actively trading rather than static —
 * deterministic per bucket so server and client render the same signal.
 */

export type LiveSignal = {
  instrument: string;
  side: "Long" | "Short";
  pnlPct: number;
  openedMinutesAgo: number;
};

const BUCKET_MS = 4 * 60 * 1000;

const INSTRUMENT_POOLS: Record<string, string[]> = {
  Stocks: ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL"],
  Crypto: ["BTC/USD", "ETH/USD", "SOL/USD"],
  Forex: ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CHF"],
  Indices: ["S&P 500", "Nasdaq 100", "DAX 40", "FTSE 100"],
  Commodities: ["Gold", "Silver", "Crude Oil", "Copper"],
};

function instrumentFor(trader: Trader, rnd: () => number) {
  const market = trader.markets[Math.floor(rnd() * trader.markets.length)] ?? "Indices";
  const pool = INSTRUMENT_POOLS[market] ?? [market];
  return pool[Math.floor(rnd() * pool.length)];
}

export function formatSignalAge(min: number) {
  if (min < 60) return `${min}m ago`;
  return `${Math.floor(min / 60)}h ${min % 60}m ago`;
}

export function currentSignal(trader: Trader, now = Date.now()): LiveSignal {
  const bucket = Math.floor(now / BUCKET_MS);
  const rnd = rngFor(`sig:${trader.slug}:${bucket}`);
  const winBias = trader.winRate / 100;
  const side: "Long" | "Short" = rnd() < 0.62 ? "Long" : "Short";
  const inProfit = rnd() < winBias;
  const magnitude = 0.15 + rnd() * (1.6 + trader.riskScore * 0.25);
  const pnlPct = Math.round((inProfit ? magnitude : -magnitude * 0.6) * 100) / 100;
  return {
    instrument: instrumentFor(trader, rnd),
    side,
    pnlPct,
    openedMinutesAgo: Math.round(2 + rnd() * 170),
  };
}
