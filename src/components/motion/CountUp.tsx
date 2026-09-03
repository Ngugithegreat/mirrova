"use client";

import { useEffect, useRef, useState } from "react";

/** Counts from 0 to `value` when scrolled into view. */
export default function CountUp({
  value,
  format = "plain",
  duration = 1600,
  className,
}: {
  value: number;
  format?: "money-compact" | "count" | "plain";
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || started.current) return;
        started.current = true;
        io.disconnect();
        const t0 = performance.now();
        const step = (t: number) => {
          const p = Math.min((t - t0) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay(value * eased);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  let text: string;
  if (format === "money-compact") {
    text =
      display >= 1e9 ? `$${(display / 1e9).toFixed(1)}B`
      : display >= 1e6 ? `$${(display / 1e6).toFixed(1)}M`
      : display >= 1e3 ? `$${(display / 1e3).toFixed(0)}K`
      : `$${display.toFixed(0)}`;
  } else if (format === "count") {
    text =
      display >= 1e6 ? `${(display / 1e6).toFixed(1)}M`
      : display >= 1e3 ? `${(display / 1e3).toFixed(1)}K`
      : `${Math.round(display)}`;
  } else {
    text = `${Math.round(display)}`;
  }

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
