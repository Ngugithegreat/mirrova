"use client";

import { useEffect, useRef } from "react";

/**
 * A quiet constellation of nodes with thin connecting lines — a handful are
 * "strategist" hubs. At random intervals a bright pulse of light travels
 * from a hub out to another node: the literal shape of copy trading, a
 * signal firing from one trader out to many, rendered as restrained
 * generative motion instead of decoration. Canvas-drawn (no external
 * assets), client-only, frozen to a single still frame under
 * prefers-reduced-motion.
 */

type Node = { x: number; y: number; vx: number; vy: number; r: number; hub: boolean };
type Pulse = { from: Node; to: Node; t: number; speed: number; color: string };

const PULSE_COLORS = ["#22d3ee", "#8b5cf6", "#e879f9", "#34d399"];

export default function TradeNetwork({
  className = "",
  density = 1,
  opacity = 1,
}: {
  className?: string;
  density?: number;
  opacity?: number;
}) {
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
    let nodes: Node[] = [];
    let pulses: Pulse[] = [];
    let raf = 0;

    function seed() {
      const target = Math.round(((width * height) / 24000) * density);
      const count = Math.max(16, Math.min(58, target));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
        r: Math.random() < 0.13 ? 2.6 : 1.4,
        hub: Math.random() < 0.13,
      }));
      pulses = [];
    }

    function resize() {
      width = container!.clientWidth;
      height = container!.clientHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function spawnPulse() {
      if (Math.random() > 0.018) return;
      const hubs = nodes.filter((n) => n.hub);
      const targets = nodes.filter((n) => !n.hub);
      if (!hubs.length || !targets.length) return;
      const from = hubs[(Math.random() * hubs.length) | 0];
      const to = targets[(Math.random() * targets.length) | 0];
      if (Math.hypot(to.x - from.x, to.y - from.y) > width * 0.55) return;
      pulses.push({
        from,
        to,
        t: 0,
        speed: 0.007 + Math.random() * 0.006,
        color: PULSE_COLORS[(Math.random() * PULSE_COLORS.length) | 0],
      });
    }

    function render(animate: boolean) {
      ctx!.clearRect(0, 0, width, height);

      if (animate) {
        for (const n of nodes) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > width) n.vx *= -1;
          if (n.y < 0 || n.y > height) n.vy *= -1;
        }
      }

      const linkDist = Math.min(width * 0.32, 210);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d >= linkDist) continue;
          ctx!.strokeStyle = `rgba(159,163,189,${(1 - d / linkDist) * 0.24})`;
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }
      }

      for (const n of nodes) {
        ctx!.beginPath();
        if (n.hub) {
          ctx!.shadowColor = "#22d3ee";
          ctx!.shadowBlur = 9;
          ctx!.fillStyle = "rgba(34,211,238,0.95)";
        } else {
          ctx!.shadowBlur = 0;
          ctx!.fillStyle = "rgba(240,241,250,0.4)";
        }
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.shadowBlur = 0;

      if (!animate) return;

      spawnPulse();
      pulses = pulses.filter((p) => p.t <= 1);
      for (const p of pulses) {
        p.t += p.speed;
        const x = p.from.x + (p.to.x - p.from.x) * p.t;
        const y = p.from.y + (p.to.y - p.from.y) * p.t;
        const tailT = Math.max(0, p.t - 0.1);
        const tx = p.from.x + (p.to.x - p.from.x) * tailT;
        const ty = p.from.y + (p.to.y - p.from.y) * tailT;

        ctx!.globalAlpha = 0.55;
        ctx!.strokeStyle = p.color;
        ctx!.lineWidth = 1.4;
        ctx!.beginPath();
        ctx!.moveTo(tx, ty);
        ctx!.lineTo(x, y);
        ctx!.stroke();
        ctx!.globalAlpha = 1;

        ctx!.beginPath();
        ctx!.shadowColor = p.color;
        ctx!.shadowBlur = 11;
        ctx!.fillStyle = p.color;
        ctx!.arc(x, y, 2.3, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }
    }

    function loop() {
      render(true);
      raf = requestAnimationFrame(loop);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    if (reduceMotion) {
      render(false);
    } else {
      loop();
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 h-full w-full ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}
