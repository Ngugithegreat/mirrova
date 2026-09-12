"use client";

import { useEffect, useState } from "react";

export default function SignalTestingTab() {
  const [saved, setSaved] = useState<{ winRatePct: number; riskPct: number } | null>(null);
  const [winDraft, setWinDraft] = useState(55);
  const [riskDraft, setRiskDraft] = useState(50);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        const winRatePct = d.winRatePct ?? 55;
        const riskPct = d.riskPct ?? 50;
        setSaved({ winRatePct, riskPct });
        setWinDraft(winRatePct);
        setRiskDraft(riskPct);
      })
      .catch(() => setSaved({ winRatePct: 55, riskPct: 50 }));
  }, []);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winRatePct: winDraft, riskPct: riskDraft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setSaved({ winRatePct: data.winRatePct, riskPct: data.riskPct });
      setMsg({ kind: "ok", text: "Saved." });
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  if (saved == null) return <div className="py-16 text-center text-ink-3">Loading…</div>;

  const dirty = winDraft !== saved.winRatePct || riskDraft !== saved.riskPct;

  return (
    <div className="max-w-2xl">
      <div className="rounded-xl border border-warn/40 bg-warn/10 p-4 text-sm text-warn">
        <strong>Testing only.</strong> These dials engineer the paper-settlement engine&apos;s outcomes and position
        sizing for end-to-end team testing before going live — they&apos;ll be removed once this platform settles
        real trades for real. Signal providers are not real people; nothing here affects any user&apos;s real
        balance.
      </div>

      <div className="panel mt-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">System win rate</h2>
          <span className="tnum text-2xl font-semibold text-ink">{winDraft}%</span>
        </div>
        <p className="mt-1.5 text-sm text-ink-2">
          The share of illustrative trades across every trader/copier that are designed to close in profit. Set it
          low (e.g. 20-30%) to observe a losing scenario end-to-end, or high (70-80%+) for a profitable one.
        </p>
        <input
          type="range"
          aria-label="System win rate percentage"
          min={0}
          max={100}
          step={1}
          value={winDraft}
          onChange={(e) => setWinDraft(Number(e.target.value))}
          className="mt-5 w-full accent-[#22d3ee]"
        />
        <div className="mt-1 flex justify-between text-[11px] text-ink-3">
          <span>0% — always loses</span>
          <span>50%</span>
          <span>100% — always wins</span>
        </div>
      </div>

      <div className="panel mt-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Risk per trade</h2>
          <span className="tnum text-2xl font-semibold text-ink">{riskDraft}%</span>
        </div>
        <p className="mt-1.5 text-sm text-ink-2">
          How much of a copier&apos;s allocation each illustrative trade risks (its position size). Raise this if
          trades are barely moving a test balance — a small allocation at a low risk % will only ever produce
          cents-level P&amp;L even with a strong win rate.
        </p>
        <input
          type="range"
          aria-label="Risk per trade percentage"
          min={1}
          max={100}
          step={1}
          value={riskDraft}
          onChange={(e) => setRiskDraft(Number(e.target.value))}
          className="mt-5 w-full accent-[#e879f9]"
        />
        <div className="mt-1 flex justify-between text-[11px] text-ink-3">
          <span>1% — barely moves</span>
          <span>50%</span>
          <span>100% — full allocation per trade</span>
        </div>
      </div>

      {msg && <p className={`mt-4 text-sm ${msg.kind === "ok" ? "text-mint" : "text-neg"}`}>{msg.text}</p>}

      <button
        onClick={save}
        disabled={busy || !dirty}
        className="mt-5 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:border-mint/50 hover:text-mint disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save"}
      </button>

      <p className="mt-4 text-xs text-ink-3">
        Applies immediately — saving closes every currently-open illustrative position right away and opens a fresh
        one under these settings the next time an account with a real allocation is viewed.
      </p>
    </div>
  );
}
