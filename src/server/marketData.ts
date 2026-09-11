import { currentPrice } from "@/lib/deskMarket";

/**
 * Real price for the two instruments Binance's public REST exposes without
 * any key; every other instrument falls back to `deskMarket.currentPrice`
 * (already deterministic and live-feeling, needs no paid data key). A short
 * in-memory cache avoids hitting Binance on every single read.
 */

const BINANCE_SYMBOL: Record<string, string> = { "BTC/USD": "BTCUSDT", "ETH/USD": "ETHUSDT" };
const CACHE_MS = 10_000;
const FETCH_TIMEOUT_MS = 2500;

const cache = new Map<string, { price: number; at: number }>();

async function fetchBinancePrice(binanceSymbol: string): Promise<number | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const price = Number(data?.price);
    return Number.isFinite(price) && price > 0 ? price : null;
  } catch {
    return null;
  }
}

export async function getRealPrice(sym: string): Promise<number> {
  const binanceSymbol = BINANCE_SYMBOL[sym];
  if (!binanceSymbol) return currentPrice(sym);

  const cached = cache.get(sym);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.price;

  const price = await fetchBinancePrice(binanceSymbol);
  if (price == null) return currentPrice(sym);

  cache.set(sym, { price, at: Date.now() });
  return price;
}
