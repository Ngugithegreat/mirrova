import { rngFor } from "@/lib/prng";

/**
 * Ambient "successful trading" backdrop: a faint ascending candlestick
 * skyline (always green, always trending up) with small prosperity
 * particles drifting upward through it, like light rising off a winning
 * chart. Deterministic (seeded) so server and client render identically.
 */

const COLORS = ["#22d3ee", "#8b5cf6", "#e879f9", "#34d399", "#fbbf24"];

function buildParticles(seed: string, count: number) {
  const rnd = rngFor(seed);
  return Array.from({ length: count }, (_, i) => {
    const left = rnd() * 100;
    const size = 2 + rnd() * 4;
    const duration = 10 + rnd() * 10;
    const delay = -rnd() * duration; // negative delay = already mid-flight on first paint
    const drift = (rnd() - 0.5) * 90;
    const color = COLORS[Math.floor(rnd() * COLORS.length)];
    const opacity = 0.35 + rnd() * 0.45;
    return { id: i, left, size, duration, delay, drift, color, opacity };
  });
}

function buildCandles(seed: string, count: number) {
  const rnd = rngFor(seed);
  let v = 28;
  return Array.from({ length: count }, () => {
    v = Math.max(14, Math.min(94, v + (rnd() - 0.3) * 28));
    return Math.round(v);
  });
}

export default function ProsperityField({
  className = "",
  dim = false,
  particleCount = 26,
}: {
  className?: string;
  dim?: boolean;
  particleCount?: number;
}) {
  const particles = buildParticles(`prosperity-${particleCount}-${dim}`, particleCount);
  const candles = buildCandles("prosperity-candles", 18);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 720 170"
        preserveAspectRatio="none"
        className={`skyline-glow absolute inset-x-0 bottom-0 h-[230px] w-full ${dim ? "opacity-[0.09]" : "opacity-[0.17]"}`}
      >
        <defs>
          <linearGradient id={`candle-up-${dim ? "d" : "b"}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="65%" stopColor="#22d3ee" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
        </defs>
        {candles.map((h, i) => {
          const w = 720 / candles.length;
          const x = i * w;
          const wickH = h + 14;
          return (
            <g key={i}>
              <line
                x1={x + w / 2}
                x2={x + w / 2}
                y1={170 - wickH}
                y2={170}
                stroke={`url(#candle-up-${dim ? "d" : "b"})`}
                strokeWidth="1"
              />
              <rect
                x={x + w * 0.24}
                y={170 - h}
                width={w * 0.52}
                height={h}
                fill={`url(#candle-up-${dim ? "d" : "b"})`}
                rx="1.5"
              />
            </g>
          );
        })}
      </svg>

      {particles.map((p) => (
        <span
          key={p.id}
          className="particle-rise absolute rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: "-12px",
            width: p.size,
            height: p.size,
            background: p.color,
            opacity: dim ? p.opacity * 0.55 : p.opacity,
            boxShadow: `0 0 ${p.size * 2.5}px ${p.color}`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
