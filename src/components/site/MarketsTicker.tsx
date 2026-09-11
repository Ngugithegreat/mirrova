"use client";

import { useEffect, useState } from "react";
import { rngFor } from "@/lib/prng";
import { INSTRUMENTS } from "@/lib/instruments";

const TICK_BUCKET_MS = 90 * 1000;

function tickerItems(bucket: number) {
  return INSTRUMENTS.map((m) => {
    const rnd = rngFor(`ticker:${m.sym}:${bucket}`);
    const chg = Math.round((rnd() - 0.45) * 360) / 100;
    const price = Math.round(m.price * (1 + chg / 100 / 3) * 10 ** m.decimals) / 10 ** m.decimals;
    return { ...m, price, chg };
  });
}

export default function MarketsTicker() {
  const [bucket, setBucket] = useState(0);

  useEffect(() => {
    setBucket(Math.floor(Date.now() / TICK_BUCKET_MS));
    const id = setInterval(() => setBucket(Math.floor(Date.now() / TICK_BUCKET_MS)), 15_000);
    return () => clearInterval(id);
  }, []);

  const items = tickerItems(bucket);
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
