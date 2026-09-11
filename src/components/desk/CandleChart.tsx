"use client";

import { useMemo } from "react";
import type { Candle } from "@/lib/deskMarket";

const W = 920;

export default function CandleChart({ candles, height = 320, decimals = 2 }: { candles: Candle[]; height?: number; decimals?: number }) {
  const padL = 60;
  const padR = 16;
  const padT = 14;
  const padB = 10;

  const { bars, yTicks } = useMemo(() => {
    const vals = candles.flatMap((c) => [c.h, c.l]);
    const min0 = Math.min(...vals);
    const max0 = Math.max(...vals);
    const range = max0 - min0 || min0 * 0.01 || 1;
    const min = min0 - range * 0.1;
    const max = max0 + range * 0.1;
    const yFor = (v: number) => padT + (1 - (v - min) / (max - min)) * (height - padT - padB);

    const n = candles.length;
    const slot = (W - padL - padR) / Math.max(1, n);
    const bodyW = Math.max(2, slot * 0.6);

    const bars = candles.map((c, i) => {
      const x = padL + i * slot + slot / 2;
      const up = c.c >= c.o;
      return {
        x,
        bodyW,
        up,
        yHigh: yFor(c.h),
        yLow: yFor(c.l),
        yOpen: yFor(c.o),
        yClose: yFor(c.c),
      };
    });

    const tickCount = 4;
    const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
      const v = min + ((max - min) * i) / tickCount;
      return { v, y: yFor(v) };
    });

    return { bars, yTicks };
  }, [candles, height]);

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full touch-none select-none" role="img" aria-label="Price chart">
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={t.y} y2={t.y} stroke="var(--color-line-soft)" strokeWidth="1" />
          <text x={padL - 8} y={t.y + 3.5} textAnchor="end" fontSize="10" fill="var(--color-ink-3)" className="tnum">
            {t.v.toFixed(decimals)}
          </text>
        </g>
      ))}
      {bars.map((b, i) => (
        <g key={i}>
          <line x1={b.x} x2={b.x} y1={b.yHigh} y2={b.yLow} stroke={b.up ? "var(--color-pos)" : "var(--color-neg)"} strokeWidth="1.4" />
          <rect
            x={b.x - b.bodyW / 2}
            y={Math.min(b.yOpen, b.yClose)}
            width={b.bodyW}
            height={Math.max(1.5, Math.abs(b.yClose - b.yOpen))}
            fill={b.up ? "var(--color-pos)" : "var(--color-neg)"}
          />
        </g>
      ))}
    </svg>
  );
}
