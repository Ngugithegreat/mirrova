"use client";

import { useEffect, useState } from "react";

export default function SignalTestingTab() {
  const [winRatePct, setWinRatePctState] = useState<number | null>(null);
  const [draft, setDraft] = useState(55);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setWinRatePctState(d.winRatePct ?? 55);
        setDraft(d.winRatePct ?? 55);
      })
      .catch(() => setWinRatePctState(55));
  }, []);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winRatePct: draft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setWinRatePctState(data.winRatePct);
      setMsg({ kind: "ok", text: "Saved." });
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  if (winRatePct == null) return <div className="py-16 text-center text-ink-3">Loading…</div>;

  return (
    <div className="max-w-2xl">
      <div className="rounded-xl border border-warn/40 bg-warn/10 p-4 text-sm text-warn">
        <strong>Testing only.</strong> This dial engineers the paper-settlement engine&apos;s win/loss outcomes for
        end-to-end team testing before going live — it will be removed once this platform settles real trades for
        real. Signal providers are not real people; nothing here affects any user&apos;s real balance.
      </div>

      <div className="panel mt-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">System win rate</h2>
          <span className="tnum text-2xl font-semibold text-ink">{draft}%</span>
        </div>
        <p className="mt-1.5 text-sm text-ink-2">
          The share of illustrative trades across every trader/copier that are designed to close in profit. Set it
          low (e.g. 20-30%) to observe a losing scenario end-to-end, or high (70-80%+) for a profitable one.
        </p>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={draft}
          onChange={(e) => setDraft(Number(e.target.value))}
          className="mt-5 w-full accent-[#22d3ee]"
        />
        <div className="mt-1 flex justify-between text-[11px] text-ink-3">
          <span>0% — always loses</span>
          <span>50%</span>
          <span>100% — always wins</span>
        </div>

        {msg && <p className={`mt-4 text-sm ${msg.kind === "ok" ? "text-mint" : "text-neg"}`}>{msg.text}</p>}

        <button
          onClick={save}
          disabled={busy || draft === winRatePct}
          className="mt-5 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:border-mint/50 hover:text-mint disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>

      <p className="mt-4 text-xs text-ink-3">
        Applies the next time a trader with an active real allocation opens a new illustrative position (up to 15
        minutes) — it doesn&apos;t retroactively change positions already open.
      </p>
    </div>
  );
}
