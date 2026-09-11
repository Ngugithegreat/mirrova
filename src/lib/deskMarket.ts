import { rngFor, hashString } from "./prng";
import { getInstrument } from "./instruments";

/**
 * Fake but smooth price feed for the practice Desk. Deliberately NOT a
 * cumulative random walk (which would need iterating every bucket since
 * epoch) — instead a closed-form function of `now`, so any price at any
 * instant is O(1) and server/client renders agree without shared state.
 */

const NOISE_BUCKET_MS = 2 * 60 * 1000;
const SLOW_PERIOD_MS = 6 * 60 * 60 * 1000;
const FAST_PERIOD_MS = 47 * 60 * 1000;

export function currentPrice(sym: string, now: number = Date.now()): number {
  const inst = getInstrument(sym);
  if (!inst) return 0;

  const phaseA = (hashString(`${sym}:a`) % 1000) / 1000;
  const phaseB = (hashString(`${sym}:b`) % 1000) / 1000;
  const slowWave = Math.sin((now / SLOW_PERIOD_MS + phaseA) * 2 * Math.PI) * 0.015;
  const fastWave = Math.sin((now / FAST_PERIOD_MS + phaseB) * 2 * Math.PI) * 0.008;

  const bucket = Math.floor(now / NOISE_BUCKET_MS);
  const noise = (rngFor(`desk:${sym}:${bucket}`)() - 0.5) * 0.006;

  const pct = slowWave + fastWave + noise;
  const price = inst.price * (1 + pct);
  const f = 10 ** inst.decimals;
  return Math.round(price * f) / f;
}

export type Candle = { t: number; o: number; h: number; l: number; c: number };

export function candles(sym: string, count: number, now: number = Date.now(), stepMs = 5 * 60 * 1000): Candle[] {
  const out: Candle[] = [];
  const samples = 6;
  for (let i = count - 1; i >= 0; i--) {
    const end = now - i * stepMs;
    const start = end - stepMs;
    const prices: number[] = [];
    for (let s = 0; s <= samples; s++) {
      prices.push(currentPrice(sym, start + (s / samples) * stepMs));
    }
    out.push({
      t: end,
      o: prices[0],
      c: prices[prices.length - 1],
      h: Math.max(...prices),
      l: Math.min(...prices),
    });
  }
  return out;
}
