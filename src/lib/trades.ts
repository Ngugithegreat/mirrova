import { Trader } from "./traders";
import { rngFor } from "./prng";

export type ClosedTrade = {
  instrument: string;
  side: "Long" | "Short";
  opened: string;
  held: string;
  pnlPct: number;
};

const INSTRUMENTS: Record<string, string[]> = {
  Stocks: ["AAPL", "MSFT", "NVDA", "ASML", "NOVO B", "SAP", "TSM", "AMZN"],
  Crypto: ["BTC/USD", "ETH/USD", "SOL/USD", "AVAX/USD"],
  Forex: ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CHF", "EUR/GBP"],
  Indices: ["S&P 500", "Nasdaq 100", "DAX 40", "FTSE 100", "Nikkei 225"],
  Commodities: ["Gold", "Silver", "Crude Oil (WTI)", "Copper", "Nat Gas"],
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

export function recentTrades(t: Trader, count = 8): ClosedTrade[] {
  const rnd = rngFor(`tr:${t.slug}`);
  const pool = t.markets.flatMap((m) => INSTRUMENTS[m] ?? []);
  const winRate = t.winRate / 100;
  const out: ClosedTrade[] = [];
  let day = 28;
  let monthIdx = MONTHS.length - 1;
  for (let i = 0; i < count; i++) {
    const win = rnd() < winRate;
    const mag = win ? 0.4 + rnd() * 4.2 : 0.3 + rnd() * 3.2;
    const holdDays = Math.max(0.2, t.avgHoldDays * (0.4 + rnd() * 1.3));
    day -= Math.ceil(rnd() * 6 + 1);
    if (day < 1) {
      day = 25 + Math.floor(rnd() * 3);
      monthIdx = Math.max(0, monthIdx - 1);
    }
    out.push({
      instrument: pool[Math.floor(rnd() * pool.length)] ?? "S&P 500",
      side: rnd() < (t.style === "Conservative" ? 0.85 : 0.62) ? "Long" : "Short",
      opened: `${MONTHS[monthIdx]} ${day}, 2026`,
      held: holdDays < 1 ? `${Math.round(holdDays * 24)}h` : `${holdDays.toFixed(1)}d`,
      pnlPct: Math.round((win ? mag : -mag) * 100) / 100,
    });
  }
  return out;
}
