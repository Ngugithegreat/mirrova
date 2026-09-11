"use client";

import { useEffect, useRef } from "react";

/**
 * A dot-map of the world (hand-plotted, normalized coordinates — no map
 * library or image asset) with pulses traveling between random dots, the
 * same technique as TradeNetwork.tsx but with fixed positions instead of
 * drifting nodes, since a recognizable world shape shouldn't wander.
 * Canvas-drawn, client-only, frozen to a still frame under
 * prefers-reduced-motion.
 */

// Normalized [0,1] x/y over a 2:1 world silhouette — approximate continent
// clusters, not cartographically precise.
const DOTS: [number, number][] = [
  // North America
  [0.1, 0.18], [0.14, 0.2], [0.18, 0.22], [0.08, 0.25], [0.12, 0.28], [0.16, 0.3],
  [0.2, 0.28], [0.1, 0.35], [0.14, 0.38], [0.18, 0.4], [0.22, 0.42], [0.12, 0.45],
  [0.16, 0.48], [0.2, 0.5], [0.24, 0.52], [0.09, 0.5],
  // South America
  [0.24, 0.58], [0.26, 0.62], [0.28, 0.66], [0.25, 0.7], [0.27, 0.74], [0.29, 0.78],
  [0.26, 0.82], [0.28, 0.86], [0.24, 0.9], [0.3, 0.6],
  // Europe
  [0.46, 0.18], [0.48, 0.2], [0.5, 0.22], [0.52, 0.19], [0.54, 0.24], [0.47, 0.26],
  [0.5, 0.28], [0.44, 0.22],
  // Africa
  [0.46, 0.38], [0.5, 0.4], [0.54, 0.42], [0.48, 0.45], [0.52, 0.48], [0.46, 0.52],
  [0.5, 0.55], [0.54, 0.58], [0.48, 0.62], [0.52, 0.66], [0.5, 0.7], [0.46, 0.68],
  // Middle East / South Asia
  [0.58, 0.32], [0.62, 0.34], [0.66, 0.36], [0.6, 0.38], [0.64, 0.4], [0.58, 0.42],
  [0.62, 0.44], [0.66, 0.46],
  // East Asia
  [0.72, 0.2], [0.76, 0.22], [0.8, 0.24], [0.74, 0.26], [0.78, 0.28], [0.82, 0.26],
  [0.76, 0.32], [0.8, 0.34], [0.72, 0.3], [0.84, 0.3], [0.78, 0.38], [0.74, 0.36],
  // Southeast Asia
  [0.78, 0.46], [0.8, 0.48], [0.82, 0.5], [0.79, 0.52], [0.83, 0.54], [0.77, 0.5],
  // Australia
  [0.82, 0.72], [0.86, 0.74], [0.9, 0.76], [0.84, 0.78], [0.88, 0.8], [0.82, 0.8],
];

const PULSE_COLORS = ["#22d3ee", "#8b5cf6", "#e879f9", "#34d399"];

type Node = { x: number; y: number };
type Pulse = { from: Node; to: Node; t: number; speed: number; color: string };

export default function WorldNetwork({ className = "" }: { className?: string }) {
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

    function resize() {
      width = container!.clientWidth;
      height = container!.clientHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = DOTS.map(([nx, ny]) => ({ x: nx * width, y: ny * height }));
      pulses = [];
    }

    function spawnPulse() {
      if (Math.random() > 0.035) return;
      const from = nodes[(Math.random() * nodes.length) | 0];
      const to = nodes[(Math.random() * nodes.length) | 0];
      if (from === to) return;
      pulses.push({
        from,
        to,
        t: 0,
        speed: 0.006 + Math.random() * 0.006,
        color: PULSE_COLORS[(Math.random() * PULSE_COLORS.length) | 0],
      });
    }

    function render(animate: boolean) {
      ctx!.clearRect(0, 0, width, height);

      for (const n of nodes) {
        ctx!.beginPath();
        ctx!.fillStyle = "rgba(240,241,250,0.4)";
        ctx!.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
        ctx!.fill();
      }

      if (!animate) return;

      spawnPulse();
      pulses = pulses.filter((p) => p.t <= 1);
      for (const p of pulses) {
        p.t += p.speed;
        const x = p.from.x + (p.to.x - p.from.x) * p.t;
        const y = p.from.y + (p.to.y - p.from.y) * p.t;

        ctx!.globalAlpha = 0.35;
        ctx!.strokeStyle = p.color;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(p.from.x, p.from.y);
        ctx!.lineTo(p.to.x, p.to.y);
        ctx!.stroke();
        ctx!.globalAlpha = 1;

        ctx!.beginPath();
        ctx!.shadowColor = p.color;
        ctx!.shadowBlur = 10;
        ctx!.fillStyle = p.color;
        ctx!.arc(x, y, 2.2, 0, Math.PI * 2);
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
  }, []);

  return <canvas ref={canvasRef} className={`absolute inset-0 h-full w-full ${className}`} aria-hidden="true" />;
}
