"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Draws itself on with a stroke animation, then keeps ticking: every ~1.6s a
 * new point drifts in on the right and the window slides — the chart is alive.
 */
export default function LiveChart({
  initial,
  height = 190,
  width = 460,
}: {
  initial: number[];
  height?: number;
  width?: number;
}) {
  const [data, setData] = useState(initial);
  const [ticking, setTicking] = useState(false);
  const drift = useRef(0);

  useEffect(() => {
    const start = setTimeout(() => setTicking(true), 2600); // after draw-on completes
    const id = setInterval(() => {
      setData((d) => {
        const last = d[d.length - 1];
        drift.current = drift.current * 0.86 + (Math.random() - 0.47) * 0.9;
        const next = Math.max(last * 0.985, last + drift.current + (Math.random() - 0.48) * last * 0.006);
        return [...d.slice(1), next];
      });
    }, 1600);
    return () => {
      clearTimeout(start);
      clearInterval(id);
    };
  }, []);

  const { path, area, end } = useMemo(() => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = 8 + (1 - (v - min) / span) * (height - 16);
      return [x, y] as const;
    });
    const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    return {
      path,
      area: `${path} L${width},${height} L0,${height} Z`,
      end: pts[pts.length - 1],
    };
  }, [data, width, height]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="lc-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="55%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#e879f9" />
        </linearGradient>
        <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={width} y1={height * f} y2={height * f} stroke="var(--color-line-soft)" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#lc-fill)" className={ticking ? undefined : "fade-in-late"} />
      <path
        d={path}
        fill="none"
        stroke="url(#lc-stroke)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        className={ticking ? undefined : "draw-line"}
      />
      <circle cx={end[0]} cy={end[1]} r="5" fill="#22d3ee" className="pulse-dot" />
      <circle cx={end[0]} cy={end[1]} r="4" fill="#22d3ee" stroke="var(--color-bg)" strokeWidth="2" />
    </svg>
  );
}
