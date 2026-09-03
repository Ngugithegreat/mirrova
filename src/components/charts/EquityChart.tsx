"use client";

import { useMemo, useRef, useState } from "react";
import { MONTH_LABELS } from "@/lib/traders";

type Props = {
  data: number[]; // weekly points, base 100
  height?: number;
};

const W = 920;

export default function EquityChart({ data, height = 320 }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const padL = 46;
  const padR = 16;
  const padT = 14;
  const padB = 28;

  const { pts, min, max, yTicks } = useMemo(() => {
    const min0 = Math.min(...data);
    const max0 = Math.max(...data);
    const range = max0 - min0 || 1;
    const min = min0 - range * 0.06;
    const max = max0 + range * 0.06;
    const pts = data.map((v, i) => {
      const x = padL + (i / (data.length - 1)) * (W - padL - padR);
      const y = padT + (1 - (v - min) / (max - min)) * (height - padT - padB);
      return { x, y, v };
    });
    const tickCount = 4;
    const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
      const v = min + ((max - min) * i) / tickCount;
      return { v, y: padT + (1 - i / tickCount) * (height - padT - padB) };
    });
    return { pts, min, max, yTicks };
  }, [data, height]);

  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${path} L${pts[pts.length - 1].x.toFixed(1)},${height - padB} L${padL},${height - padB} Z`;

  // x labels: every 4 months
  const xLabels = MONTH_LABELS.map((m, i) => ({ ...m, i })).filter((_, i) => i % 4 === 0);

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((x - padL) / (W - padL - padR)) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, idx)));
  }

  const h = hover != null ? pts[hover] : null;
  const hMonth = hover != null ? MONTH_LABELS[Math.min(23, Math.floor((hover - 1) / 4))] : null;
  const hRet = h ? ((h.v - 100) / 100) * 100 : 0;

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${height}`}
        className="w-full touch-none select-none"
        role="img"
        aria-label="Equity curve, growth of $100 over the last 24 months"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="eq-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-mint)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-mint)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={t.y} y2={t.y} stroke="var(--color-line-soft)" strokeWidth="1" />
            <text x={padL - 8} y={t.y + 3.5} textAnchor="end" fontSize="11" fill="var(--color-ink-3)" className="tnum">
              {Math.round(t.v)}
            </text>
          </g>
        ))}

        {xLabels.map((m) => {
          const x = padL + ((m.i * 4 + 1) / (data.length - 1)) * (W - padL - padR);
          return (
            <text key={`${m.label}${m.year}${m.i}`} x={x} y={height - 8} textAnchor="middle" fontSize="11" fill="var(--color-ink-3)">
              {m.label} {String(m.year).slice(2)}
            </text>
          );
        })}

        <path d={area} fill="url(#eq-fill)" className="fade-in-late" />
        <path d={path} fill="none" stroke="var(--color-mint)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" pathLength={1} className="draw-line" />
        <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="5" fill="var(--color-mint)" className="pulse-dot" style={{ animationDelay: "2.4s" }} />
        <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3.5" fill="var(--color-mint)" stroke="var(--color-bg)" strokeWidth="1.5" className="fade-in-late" />

        {h && (
          <g>
            <line x1={h.x} x2={h.x} y1={padT} y2={height - padB} stroke="rgba(159,163,189,0.4)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={h.x} cy={h.y} r="4.5" fill="var(--color-mint)" stroke="var(--color-bg)" strokeWidth="2" />
          </g>
        )}
      </svg>

      {h && hMonth && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-[3px] bg-overlay px-3 py-2 text-xs shadow-xl"
          style={{
            left: `${(h.x / W) * 100}%`,
            top: Math.max(0, (h.y / height) * 100 - 22) + "%",
          }}
        >
          <div className="text-[#bdb9ac]">
            {hMonth.label} {hMonth.year}
          </div>
          <div className="tnum mt-0.5 font-semibold text-[#f2efe6]">${h.v.toFixed(1)}</div>
          <div className={`tnum ${hRet >= 0 ? "text-[#4bc48b]" : "text-[#e0705f]"}`}>
            {hRet >= 0 ? "+" : ""}
            {hRet.toFixed(1)}% total
          </div>
        </div>
      )}
    </div>
  );
}
