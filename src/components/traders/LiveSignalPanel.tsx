"use client";

import { useEffect, useState } from "react";
import type { Trader } from "@/lib/traders";
import { currentSignal, formatSignalAge, type LiveSignal } from "@/lib/liveSignal";
import { fmtPct, cx } from "@/lib/format";

export default function LiveSignalPanel({ trader }: { trader: Trader }) {
  const [signal, setSignal] = useState<LiveSignal | null>(null);

  useEffect(() => {
    setSignal(currentSignal(trader));
    const id = setInterval(() => setSignal(currentSignal(trader)), 60_000);
    return () => clearInterval(id);
  }, [trader]);

  return (
    <div className="panel p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">Live position</h3>
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute h-full w-full animate-ping rounded-full bg-pos opacity-60" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-pos" />
        </span>
      </div>

      {signal ? (
        <>
          <div className="mt-4 flex items-center gap-2">
            <span
              className={cx(
                "rounded-md px-2 py-1 text-xs font-bold uppercase",
                signal.side === "Long" ? "bg-pos/15 text-pos" : "bg-neg/15 text-neg"
              )}
            >
              {signal.side}
            </span>
            <span className="text-sm font-semibold text-ink">{signal.instrument}</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-line-soft pt-3">
            <span className="text-xs text-ink-3">Unrealized P&L</span>
            <span className={cx("tnum text-lg font-semibold", signal.pnlPct >= 0 ? "text-pos" : "text-neg")}>
              {fmtPct(signal.pnlPct, { digits: 2 })}
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xs text-ink-3">Opened</span>
            <span className="tnum text-xs text-ink-2">{formatSignalAge(signal.openedMinutesAgo)}</span>
          </div>
        </>
      ) : (
        <div className="mt-4 h-[74px] animate-pulse rounded-lg bg-raised/60" />
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-ink-3">
        Illustrative live-feed preview — updates automatically as {trader.name.split(" ")[0]} adjusts positions.
      </p>
    </div>
  );
}
