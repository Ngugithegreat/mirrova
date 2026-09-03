import { rngFor } from "@/lib/prng";

const MARKETS: { sym: string; price: number; decimals: number }[] = [
  { sym: "BTC/USD", price: 96420, decimals: 0 },
  { sym: "ETH/USD", price: 4285, decimals: 0 },
  { sym: "S&P 500", price: 6890, decimals: 1 },
  { sym: "NASDAQ 100", price: 25120, decimals: 1 },
  { sym: "EUR/USD", price: 1.0942, decimals: 4 },
  { sym: "GBP/USD", price: 1.3118, decimals: 4 },
  { sym: "GOLD", price: 4012.5, decimals: 1 },
  { sym: "USD/JPY", price: 148.32, decimals: 2 },
  { sym: "CRUDE OIL", price: 71.84, decimals: 2 },
  { sym: "DAX 40", price: 24310, decimals: 1 },
  { sym: "SILVER", price: 48.9, decimals: 2 },
  { sym: "AAPL", price: 268.4, decimals: 2 },
];

export default function MarketsTicker() {
  const rnd = rngFor("ticker");
  const items = MARKETS.map((m) => ({
    ...m,
    chg: Math.round((rnd() - 0.45) * 360) / 100,
  }));
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center" aria-hidden={key === "b"}>
      {items.map((m) => (
        <div key={`${key}-${m.sym}`} className="flex items-baseline gap-2.5 border-r border-line-soft px-7 py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-3">{m.sym}</span>
          <span className="tnum text-xs text-ink">
            {m.price.toLocaleString("en-US", { minimumFractionDigits: m.decimals, maximumFractionDigits: m.decimals })}
          </span>
          <span className={`tnum text-[11px] ${m.chg >= 0 ? "text-pos" : "text-neg"}`}>
            {m.chg >= 0 ? "+" : "−"}{Math.abs(m.chg).toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
  return (
    <div className="relative overflow-hidden border-y border-line bg-surface">
      <div className="ticker-track flex w-max">{[row("a"), row("b")]}</div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-bg to-transparent" />
    </div>
  );
}
