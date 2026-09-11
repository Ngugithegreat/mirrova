"use client";

import { useEffect, useRef } from "react";
import { rngFor } from "@/lib/prng";

/**
 * An ambient, continuously left-scrolling price line behind the hero copy —
 * ticker-style background texture, not a real chart. Closed-form and
 * periodic (same "cheap to evaluate at any time" philosophy as
 * deskMarket.currentPrice) rather than a stateful random walk: the path is
 * built once into a fixed-length loop, then each frame just samples it at a
 * time-based scroll offset. Canvas-drawn, frozen to a still frame under
 * prefers-reduced-motion, matching TradeNetwork.tsx's conventions.
 */

const LOOP_PX = 2200;
const STEP = 4;
const SPEED_PX_PER_SEC = 22;

function buildPath(): number[] {
  const n = Math.ceil(LOOP_PX / STEP);
  const pts: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = i * STEP;
    const a = Math.sin(x * 0.0042) * 0.46;
    const b = Math.sin(x * 0.012 + 2.1) * 0.2;
    // A gentle running average of nearby seeded noise reads as a real price
    // wobble instead of jagged static — smoother than a raw per-point roll.
    const n1 = rngFor(`hero-ticker:${i}`)();
    const n2 = rngFor(`hero-ticker:${i + 1}`)();
    const noise = (n1 * 0.7 + n2 * 0.3 - 0.5) * 0.1;
    pts.push(0.5 + a + b + noise);
  }
  return pts;
}

const PATH = buildPath();

export default function PriceTicker({ className = "", opacity = 0.42 }: { className?: string; opacity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !container || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let raf = 0;
    const start = performance.now();

    function resize() {
      width = container!.clientWidth;
      height = container!.clientHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function sample(px: number) {
      const idx = Math.floor(px / STEP) % PATH.length;
      return PATH[idx < 0 ? idx + PATH.length : idx];
    }

    function render(offsetPx: number) {
      ctx!.clearRect(0, 0, width, height);
      const padY = height * 0.08;
      const usable = height - padY * 2;
      const yAt = (px: number) => padY + (1 - sample(px + offsetPx)) * usable;

      const grad = ctx!.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, "#8b5cf6");
      grad.addColorStop(0.55, "#22d3ee");
      grad.addColorStop(1, "#e879f9");

      const fillGrad = ctx!.createLinearGradient(0, 0, 0, height);
      fillGrad.addColorStop(0, "rgba(34,211,238,0.28)");
      fillGrad.addColorStop(1, "rgba(34,211,238,0)");

      ctx!.beginPath();
      for (let px = 0; px <= width; px += STEP) {
        const y = yAt(px);
        if (px === 0) ctx!.moveTo(px, y);
        else ctx!.lineTo(px, y);
      }
      ctx!.lineTo(width, height);
      ctx!.lineTo(0, height);
      ctx!.closePath();
      ctx!.fillStyle = fillGrad;
      ctx!.fill();

      ctx!.save();
      ctx!.shadowColor = "#22d3ee";
      ctx!.shadowBlur = 14;
      ctx!.beginPath();
      for (let px = 0; px <= width; px += STEP) {
        const y = yAt(px);
        if (px === 0) ctx!.moveTo(px, y);
        else ctx!.lineTo(px, y);
      }
      ctx!.strokeStyle = grad;
      ctx!.lineWidth = 3;
      ctx!.lineJoin = "round";
      ctx!.stroke();
      ctx!.restore();

      // A bright traveling dot anchors the line as "live price data" —
      // reads unmistakably as a chart rather than the constellation mesh
      // it shares the background with.
      const dotX = width * 0.82;
      const dotY = yAt(dotX);
      ctx!.beginPath();
      ctx!.shadowColor = "#22d3ee";
      ctx!.shadowBlur = 16;
      ctx!.fillStyle = "#22d3ee";
      ctx!.arc(dotX, dotY, 4, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.shadowBlur = 0;
    }

    function loop(now: number) {
      const elapsedSec = (now - start) / 1000;
      render((elapsedSec * SPEED_PX_PER_SEC) % LOOP_PX);
      raf = requestAnimationFrame(loop);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    if (reduceMotion) {
      render(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 h-full w-full ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}
