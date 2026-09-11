"use client";

import { useEffect, useState } from "react";
import TraderAvatar from "@/components/ui/TraderAvatar";

const SCENE_MS = 3400;
const SCENES = 4;

function MiniSpark({ up = true, id }: { up?: boolean; id: string }) {
  const d = up
    ? "M0,26 L10,22 L20,24 L30,16 L40,18 L52,10 L64,12 L76,5"
    : "M0,8 L12,12 L24,10 L36,18 L48,16 L62,22 L76,20";
  return (
    <svg viewBox="0 0 76 30" className="h-[30px] w-[76px]" aria-hidden="true">
      <defs>
        <linearGradient id={`ps-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke={`url(#ps-${id})`} strokeWidth="2" strokeLinecap="round" pathLength={1} className="draw-line" />
    </svg>
  );
}

function SceneShell({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col px-4 pb-5 pt-3">
      <div className="row-in text-[9px] font-semibold uppercase tracking-[0.2em] text-mint">{eyebrow}</div>
      {children}
    </div>
  );
}

function SceneDiscover() {
  return (
    <SceneShell eyebrow="Top strategist">
      <div className="row-in mt-3 rounded-2xl border border-line bg-raised/80 p-3.5" style={{ animationDelay: "0.12s" }}>
        <div className="flex items-center gap-2.5">
          <TraderAvatar name="Isabella Rossi" size="sm" className="!h-8 !w-8 !text-[10px]" />
          <div>
            <div className="text-[11px] font-semibold text-ink">Isabella Rossi</div>
            <div className="text-[9px] text-ink-3">Global Multi-Asset</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[8px] uppercase tracking-wide text-ink-3">12m</div>
            <div className="tnum text-[12px] font-bold text-pos">+35.5%</div>
          </div>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <MiniSpark id="d1" />
          <div className="text-right">
            <div className="text-[8px] uppercase tracking-wide text-ink-3">Copiers</div>
            <div className="tnum text-[11px] font-semibold text-ink">8,034</div>
          </div>
        </div>
      </div>
      <div className="row-in mt-3 rounded-2xl border border-line bg-raised/50 p-3.5 opacity-70" style={{ animationDelay: "0.24s" }}>
        <div className="flex items-center gap-2.5">
          <TraderAvatar name="Daniel Kim" size="sm" className="!h-8 !w-8 !text-[10px]" />
          <div>
            <div className="text-[11px] font-semibold text-ink">Daniel Kim</div>
            <div className="text-[9px] text-ink-3">Crypto Rotation</div>
          </div>
          <div className="tnum ml-auto text-[12px] font-bold text-pos">+89.3%</div>
        </div>
      </div>
      <div className="relative mt-auto">
        <span className="tap-ripple absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-mint" aria-hidden="true" />
        <div className="sheen relative overflow-hidden rounded-full bg-gradient-to-r from-violet via-mint to-fuchsia py-2.5 text-center text-[11px] font-bold text-[#06060c]">
          Copy Isabella
        </div>
      </div>
    </SceneShell>
  );
}

function SceneConfigure() {
  return (
    <SceneShell eyebrow="Configure the copy">
      <div className="row-in mt-3 rounded-2xl border border-line bg-raised/80 p-4" style={{ animationDelay: "0.1s" }}>
        <div className="text-[9px] uppercase tracking-wide text-ink-3">Amount</div>
        <div className="fig mt-1 text-[26px] font-semibold text-ink">$1,000</div>
        <div className="mt-1 text-[9px] text-ink-3">of $8,450 available</div>
      </div>
      <div className="row-in mt-3 rounded-2xl border border-line bg-raised/80 p-4" style={{ animationDelay: "0.25s" }}>
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wide text-ink-3">Copy stop-loss</span>
          <span className="tnum text-[11px] font-bold text-mint">−15%</span>
        </div>
        <div className="mt-2.5 h-1.5 w-full rounded-full bg-line-soft">
          <div className="h-full w-[15%] overflow-hidden rounded-full">
            <div className="bar-grow h-full rounded-full bg-gradient-to-r from-violet to-mint" />
          </div>
        </div>
        <div className="mt-2 text-[9px] leading-relaxed text-ink-3">
          Auto-exit protects <span className="tnum text-ink-2">$850</span> of this copy
        </div>
      </div>
      <div className="row-in mt-auto" style={{ animationDelay: "0.4s" }}>
        <div className="sheen relative overflow-hidden rounded-full bg-gradient-to-r from-violet via-mint to-fuchsia py-2.5 text-center text-[11px] font-bold text-[#06060c]">
          Start copying
        </div>
      </div>
    </SceneShell>
  );
}

const MIRROR_ROWS = [
  { sym: "Nasdaq 100", side: "Long", pnl: "+0.8%" },
  { sym: "Gold", side: "Long", pnl: "+0.3%" },
  { sym: "EUR/USD", side: "Short", pnl: "+0.1%" },
];

function SceneMirror() {
  return (
    <SceneShell eyebrow="Mirroring · live">
      <div className="row-in mt-3 flex items-center gap-2 rounded-xl border border-pos/30 bg-pos/10 px-3 py-2">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute h-full w-full animate-ping rounded-full bg-pos opacity-60" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-pos" />
        </span>
        <span className="text-[10px] font-medium text-pos">3 positions mirrored in 38ms</span>
      </div>
      <div className="mt-3 space-y-2">
        {MIRROR_ROWS.map((r, i) => (
          <div
            key={r.sym}
            className="row-in flex items-center justify-between rounded-xl border border-line bg-raised/80 px-3 py-2.5"
            style={{ animationDelay: `${0.25 + i * 0.22}s` }}
          >
            <div className="flex items-center gap-2">
              <span className={`rounded-md px-1.5 py-0.5 text-[8px] font-bold ${r.side === "Long" ? "bg-pos/15 text-pos" : "bg-neg/15 text-neg"}`}>
                {r.side}
              </span>
              <span className="text-[11px] font-medium text-ink">{r.sym}</span>
            </div>
            <span className="tnum text-[11px] font-semibold text-pos">{r.pnl}</span>
          </div>
        ))}
      </div>
      <div className="row-in mt-auto text-center text-[9px] text-ink-3" style={{ animationDelay: "0.9s" }}>
        Sized to your $1,000 · exactly proportional
      </div>
    </SceneShell>
  );
}

function SceneGrow() {
  return (
    <SceneShell eyebrow="Your copy · 30 days">
      <div className="row-in mt-3 rounded-2xl border border-mint/25 bg-raised/80 p-4">
        <div className="text-[9px] uppercase tracking-wide text-ink-3">Copy value</div>
        <div className="fig mt-1 text-[26px] font-semibold text-ink">$1,028.40</div>
        <div className="tnum mt-0.5 text-[11px] font-semibold text-pos">+$28.40 · +2.8%</div>
        <div className="mt-3">
          <svg viewBox="0 0 190 46" className="w-full" aria-hidden="true">
            <defs>
              <linearGradient id="pg-l" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
              <linearGradient id="pg-f" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,38 L20,34 L40,36 L60,28 L80,30 L100,22 L120,25 L140,15 L160,18 L190,7 L190,46 L0,46 Z" fill="url(#pg-f)" className="fade-in-late" />
            <path
              d="M0,38 L20,34 L40,36 L60,28 L80,30 L100,22 L120,25 L140,15 L160,18 L190,7"
              fill="none" stroke="url(#pg-l)" strokeWidth="2.2" strokeLinecap="round" pathLength={1} className="draw-line"
            />
            <circle cx="190" cy="7" r="3.5" fill="#22d3ee" className="pulse-dot" />
            <circle cx="190" cy="7" r="2.5" fill="#22d3ee" />
          </svg>
        </div>
      </div>
      <div className="row-in mt-3 grid grid-cols-2 gap-2" style={{ animationDelay: "0.3s" }}>
        <div className="rounded-xl border border-line bg-raised/60 p-2.5 text-center">
          <div className="text-[8px] uppercase tracking-wide text-ink-3">Protected floor</div>
          <div className="tnum mt-0.5 text-[12px] font-semibold text-ink">$850</div>
        </div>
        <div className="rounded-xl border border-line bg-raised/60 p-2.5 text-center">
          <div className="text-[8px] uppercase tracking-wide text-ink-3">Exit anytime</div>
          <div className="mt-0.5 text-[12px] font-semibold text-mint">Instant</div>
        </div>
      </div>
    </SceneShell>
  );
}

export default function PhoneDemo() {
  const [scene, setScene] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAnimate(false);
      return;
    }
    const id = setInterval(() => setScene((s) => (s + 1) % SCENES), SCENE_MS);
    return () => clearInterval(id);
  }, []);

  const scenes = [SceneDiscover, SceneConfigure, SceneMirror, SceneGrow];
  const Active = scenes[scene];

  return (
    <div className="relative flex justify-center" style={{ perspective: "1400px" }}>
      <div
        className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(139,92,246,0.55), rgba(34,211,238,0.25), transparent)" }}
        aria-hidden="true"
      />

      <div className={`phone-frame relative w-[290px] rounded-[46px] p-[10px] ${animate ? "phone-tilt" : ""}`}>
        <div className="phone-shine pointer-events-none absolute inset-0 z-20 rounded-[46px]" aria-hidden="true" />

        <div className="relative flex h-[590px] flex-col overflow-hidden rounded-[37px] bg-bg">
          {/* status bar + island */}
          <div className="relative flex items-center justify-between px-6 pt-3">
            <span className="tnum text-[11px] font-semibold text-ink">9:41</span>
            <div className="absolute left-1/2 top-2.5 h-[22px] w-[86px] -translate-x-1/2 rounded-full bg-black" />
            <div className="flex items-center gap-1" aria-hidden="true">
              <svg viewBox="0 0 16 10" className="h-2.5 w-4 fill-ink"><rect x="0" y="6" width="3" height="4" rx="0.5"/><rect x="4.5" y="4" width="3" height="6" rx="0.5"/><rect x="9" y="2" width="3" height="8" rx="0.5"/><rect x="13" y="0" width="3" height="10" rx="0.5" opacity="0.35"/></svg>
              <svg viewBox="0 0 24 12" className="h-3 w-6" aria-hidden="true"><rect x="0.5" y="0.5" width="19" height="11" rx="3" fill="none" stroke="currentColor" className="text-ink-3" strokeWidth="1"/><rect x="2" y="2" width="13" height="8" rx="1.5" className="fill-pos"/><rect x="21" y="4" width="2.5" height="4" rx="1" className="fill-ink-3"/></svg>
            </div>
          </div>

          {/* app header */}
          <div className="mt-3 flex items-center justify-between border-b border-line-soft px-4 pb-2.5">
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 40 40" className="h-5 w-5" aria-hidden="true">
                <defs><linearGradient id="pdl" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#8b5cf6"/><stop offset="55%" stopColor="#22d3ee"/><stop offset="100%" stopColor="#e879f9"/></linearGradient></defs>
                <rect x="1" y="1" width="38" height="38" rx="11" fill="rgba(139,92,246,0.12)" stroke="url(#pdl)" strokeWidth="2"/>
                <path d="M10 28 V15 l6 8 4 -11 4 11 6 -8 v13" fill="none" stroke="url(#pdl)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-display text-[13px] font-semibold text-ink">asport traders</span>
            </div>
            <div className="text-right">
              <div className="text-[8px] uppercase tracking-wide text-ink-3">Balance</div>
              <div className="tnum text-[11px] font-semibold text-ink">$9,450.00</div>
            </div>
          </div>

          {/* scenes */}
          <div className="min-h-0 flex-1">
            <div key={scene} className="h-full">
              <Active />
            </div>
          </div>

          {/* progress dots */}
          <div className="flex items-center justify-center gap-1.5 pb-4" aria-hidden="true">
            {Array.from({ length: SCENES }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${i === scene ? "w-5 bg-mint" : "w-1.5 bg-line"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
