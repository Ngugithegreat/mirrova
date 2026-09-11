"use client";

import { useEffect, useState } from "react";
import type { Trader } from "@/lib/traders";
import { currentSignal, formatSignalAge, type LiveSignal } from "@/lib/liveSignal";
import { fmtPct, cx } from "@/lib/format";

export default function LiveSignalBadge({ trader, size = "sm" }: { trader: Trader; size?: "sm" | "md" }) {
  const [signal, setSignal] = useState<LiveSignal | null>(null);

  useEffect(() => {
    setSignal(currentSignal(trader));
    const id = setInterval(() => setSignal(currentSignal(trader)), 60_000);
    return () => clearInterval(id);
  }, [trader]);

  if (!signal) {
    return <div className={size === "sm" ? "h-[18px]" : "h-6"} aria-hidden="true" />;
  }

  const pos = signal.pnlPct >= 0;

  return (
    <div className={cx("flex items-center gap-1.5", size === "sm" ? "text-[10px]" : "text-xs")}>
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="absolute h-full w-full animate-ping rounded-full bg-pos opacity-60" />
        <span className="relative h-1.5 w-1.5 rounded-full bg-pos" />
      </span>
      <span
        className={cx(
          "rounded px-1 py-0.5 font-bold uppercase leading-none",
          signal.side === "Long" ? "bg-pos/15 text-pos" : "bg-neg/15 text-neg"
        )}
      >
        {signal.side}
      </span>
      <span className="font-medium text-ink-2">{signal.instrument}</span>
      <span className={cx("tnum font-semibold", pos ? "text-pos" : "text-neg")}>{fmtPct(signal.pnlPct, { digits: 2 })}</span>
      <span className="text-ink-3">· {formatSignalAge(signal.openedMinutesAgo)}</span>
    </div>
  );
}
