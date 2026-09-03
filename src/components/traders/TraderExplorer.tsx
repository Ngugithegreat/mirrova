"use client";

import { useMemo, useState } from "react";
import { TRADERS, traderStats, RiskStyle } from "@/lib/traders";
import TraderCard from "@/components/ui/TraderCard";
import Reveal from "@/components/ui/Reveal";
import { cx } from "@/lib/format";

type SortKey = "copiers" | "return12m" | "returnYtd" | "drawdown" | "aum";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "copiers", label: "Most copied" },
  { key: "return12m", label: "12m return" },
  { key: "returnYtd", label: "YTD return" },
  { key: "drawdown", label: "Lowest drawdown" },
  { key: "aum", label: "Assets under copy" },
];

const STYLES: ("All" | RiskStyle)[] = ["All", "Conservative", "Balanced", "Aggressive"];
const MARKETS = ["All", "Stocks", "Indices", "Forex", "Crypto", "Commodities"];

export default function TraderExplorer() {
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState<(typeof STYLES)[number]>("All");
  const [market, setMarket] = useState("All");
  const [sort, setSort] = useState<SortKey>("copiers");

  const enriched = useMemo(() => TRADERS.map((t) => ({ t, s: traderStats(t) })), []);

  const results = useMemo(() => {
    let list = enriched;
    if (style !== "All") list = list.filter((x) => x.t.style === style);
    if (market !== "All") list = list.filter((x) => x.t.markets.includes(market));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (x) =>
          x.t.name.toLowerCase().includes(q) ||
          x.t.strategy.toLowerCase().includes(q) ||
          x.t.country.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      switch (sort) {
        case "copiers": return b.t.copiers - a.t.copiers;
        case "return12m": return b.s.return12m - a.s.return12m;
        case "returnYtd": return b.s.returnYtd - a.s.returnYtd;
        case "drawdown": return b.s.maxDrawdown - a.s.maxDrawdown;
        case "aum": return b.t.aum - a.t.aum;
      }
    });
  }, [enriched, style, market, query, sort]);

  const chip = (active: boolean) =>
    cx(
      "rounded-full border px-4 py-1.5 text-sm transition-colors",
      active
        ? "border-mint/50 bg-mint/10 text-mint"
        : "border-line text-ink-2 hover:border-line hover:text-ink"
    );

  return (
    <div>
      {/* Filter row — one row above the grid */}
      <div className="panel flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-xs">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, strategy, country…"
            className="w-full rounded-xl border border-line bg-raised/60 py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-3 focus:border-mint/50 focus:outline-none"
            aria-label="Search traders"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Risk style">
          {STYLES.map((s) => (
            <button key={s} className={chip(style === s)} onClick={() => setStyle(s)}>
              {s}
            </button>
          ))}
        </div>
        <select
          value={market}
          onChange={(e) => setMarket(e.target.value)}
          className="rounded-xl border border-line bg-raised/60 px-3.5 py-2.5 text-sm text-ink focus:border-mint/50 focus:outline-none"
          aria-label="Market"
        >
          {MARKETS.map((m) => (
            <option key={m} value={m}>
              {m === "All" ? "All markets" : m}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-line bg-raised/60 px-3.5 py-2.5 text-sm text-ink focus:border-mint/50 focus:outline-none"
          aria-label="Sort by"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              Sort: {s.label}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-6 text-sm text-ink-3">
        <span className="tnum font-medium text-ink-2">{results.length}</span> strategies
        {style !== "All" && ` · ${style}`}
        {market !== "All" && ` · ${market}`}
      </p>

      <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {results.map((x, i) => (
          <Reveal key={x.t.slug} delay={(i % 3) * 80}>
            <TraderCard trader={x.t} />
          </Reveal>
        ))}
      </div>

      {results.length === 0 && (
        <div className="panel mt-4 p-14 text-center text-ink-2">
          No strategies match those filters — try widening the search.
        </div>
      )}
    </div>
  );
}
