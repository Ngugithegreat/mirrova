
const FALLBACK_USD_KES = 129.5;
const CACHE_MS = 5 * 60_000;

let cached: { rate: number; at: number } | null = null;

/** USD/KES rate — how many KES per 1 USD. Keyless, cached, with a safe fallback. */
export async function usdKesRate(): Promise<number> {
  if (process.env.USD_KES_RATE) return Number(process.env.USD_KES_RATE);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.rate;

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    const rate = data?.rates?.KES;
    if (typeof rate === "number" && rate > 0) {
      cached = { rate, at: Date.now() };
      return rate;
    }
  } catch {
    // fall through to fallback
  }
  return cached?.rate ?? FALLBACK_USD_KES;
}

export async function kesToUsdCents(kesCents: number): Promise<{ usdCents: number; rate: number }> {
  const rate = await usdKesRate();
  return { usdCents: Math.round(kesCents / rate), rate };
}
