"use client";

import { useEffect, useState } from "react";
import { fmtMoney, cx } from "@/lib/format";
import ActivityTab from "./ActivityTab";
import DeskTab from "./DeskTab";

type Position = {
  id: string;
  traderSlug: string;
  traderName: string;
  instrument: string;
  side: "long" | "short";
  entryPrice: number;
  closePrice: number | null;
  copierCount: number;
  totalMirroredCents: number;
  openedAt: string;
  closedAt: string | null;
};

type TraderOption = { slug: string; name: string; markets: string[] };

type Summary = { openPositions: number; copiers: number; stakedCents: number; unrealizedPnlCents: number; realizedPnlCents: number };

type EngineData = { open: Position[]; closed: Position[]; traders: TraderOption[]; summary: Summary };

const CATEGORY_INSTRUMENTS: Record<string, string[]> = {
  Stocks: ["AAPL"],
  Crypto: ["BTC/USD", "ETH/USD"],
  Forex: ["EUR/USD", "GBP/USD", "USD/JPY"],
  Indices: ["S&P 500", "NASDAQ 100", "DAX 40"],
  Commodities: ["GOLD", "CRUDE OIL", "SILVER"],
};

const STYLES = ["Conservative", "Balanced", "Aggressive"];
const ALL_MARKETS = ["Stocks", "Crypto", "Forex", "Indices", "Commodities"];

function pnlColor(cents: number) {
  return cents > 0 ? "text-pos" : cents < 0 ? "text-neg" : "text-ink";
}
function signed(cents: number) {
  return `${cents < 0 ? "−" : "+"}${fmtMoney(Math.abs(cents) / 100, 2)}`;
}

export default function EngineTab() {
  const [data, setData] = useState<EngineData | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [openTrader, setOpenTrader] = useState("");
  const [openInstrument, setOpenInstrument] = useState("");
  const [openSide, setOpenSide] = useState<"long" | "short">("long");
  const [openBusy, setOpenBusy] = useState(false);

  const [showAddProvider, setShowAddProvider] = useState(false);
  const [pName, setPName] = useState("");
  const [pCountry, setPCountry] = useState("");
  const [pStrategy, setPStrategy] = useState("");
  const [pStyle, setPStyle] = useState("Balanced");
  const [pMarkets, setPMarkets] = useState<string[]>([]);
  const [pBio, setPBio] = useState("");
  const [pFee, setPFee] = useState("20");
  const [pMin, setPMin] = useState("100");
  const [pWinRate, setPWinRate] = useState("55");
  const [addBusy, setAddBusy] = useState(false);
  const [addMsg, setAddMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Testing dial (risk per trade — position SIZE only, never the outcome)
  const [dialsSaved, setDialsSaved] = useState<{ riskPct: number } | null>(null);
  const [riskDraft, setRiskDraft] = useState(50);
  const [dialsBusy, setDialsBusy] = useState(false);
  const [dialsMsg, setDialsMsg] = useState<string | null>(null);

  // Testing tools (add funds / blow)
  const [testEmail, setTestEmail] = useState("");
  const [testAmount, setTestAmount] = useState("1000");
  const [testMinutes, setTestMinutes] = useState("2");
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [testBusy, setTestBusy] = useState<string | null>(null);
  const [autoBlowDraft, setAutoBlowDraft] = useState("0");
  const [savedAutoBlow, setSavedAutoBlow] = useState<number | null>(null);
  const [autoBlowBusy, setAutoBlowBusy] = useState(false);

  function load() {
    fetch("/api/admin/engine")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData({ open: [], closed: [], traders: [], summary: { openPositions: 0, copiers: 0, stakedCents: 0, unrealizedPnlCents: 0, realizedPnlCents: 0 } }));
  }

  function loadSettings() {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        const riskPct = d.riskPct ?? 50;
        setDialsSaved({ riskPct });
        setRiskDraft(riskPct);
        setSavedAutoBlow(d.autoBlowDays ?? 0);
        setAutoBlowDraft(String(d.autoBlowDays ?? 0));
      })
      .catch(() => setDialsSaved({ riskPct: 50 }));
  }

  useEffect(() => {
    load();
    loadSettings();
  }, []);

  const selectedTrader = data?.traders.find((t) => t.slug === openTrader);
  const instrumentPool = selectedTrader
    ? [...new Set(selectedTrader.markets.flatMap((m) => CATEGORY_INSTRUMENTS[m] ?? []))]
    : [];

  async function closePosition(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close", positionId: id }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Something went wrong.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusyId(null);
    }
  }

  async function openPosition() {
    if (!openTrader || !openInstrument) return;
    setOpenBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traderSlug: openTrader, instrument: openInstrument, side: openSide }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Something went wrong.");
      setOpenInstrument("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setOpenBusy(false);
    }
  }

  function toggleMarket(m: string) {
    setPMarkets((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  async function submitProvider() {
    setAddBusy(true);
    setAddMsg(null);
    try {
      const res = await fetch("/api/admin/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pName,
          country: pCountry,
          strategy: pStrategy,
          style: pStyle,
          markets: pMarkets,
          bio: pBio,
          perfFee: Number(pFee),
          minCopy: Number(pMin),
          winRate: Number(pWinRate),
          verified: true,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Something went wrong.");
      setAddMsg({ kind: "ok", text: `Added ${pName} — now live on the public leaderboard.` });
      setPName("");
      setPCountry("");
      setPStrategy("");
      setPMarkets([]);
      setPBio("");
      load();
    } catch (err) {
      setAddMsg({ kind: "err", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setAddBusy(false);
    }
  }

  async function saveDials() {
    setDialsBusy(true);
    setDialsMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskPct: riskDraft }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Something went wrong.");
      setDialsSaved({ riskPct: d.riskPct });
      setDialsMsg("Saved — applied immediately.");
      load();
    } catch (err) {
      setDialsMsg(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setDialsBusy(false);
    }
  }

  async function runTest(action: "credit" | "blow" | "schedule-blow" | "cancel-blow") {
    setTestBusy(action);
    setTestMsg(null);
    try {
      const res = await fetch("/api/admin/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, email: testEmail.trim() || undefined, amount: Number(testAmount), minutes: Number(testMinutes) }),
      });
      const d = await res.json().catch(() => ({}));
      setTestMsg(res.ok ? d.message ?? "Done." : d.error ?? "Failed.");
      load();
    } finally {
      setTestBusy(null);
    }
  }

  async function saveAutoBlow() {
    setAutoBlowBusy(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoBlowDays: Number(autoBlowDraft) }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.autoBlowDays != null) {
        setSavedAutoBlow(d.autoBlowDays);
        setAutoBlowDraft(String(d.autoBlowDays));
      }
    } finally {
      setAutoBlowBusy(false);
    }
  }

  if (!data || !dialsSaved) return <div className="py-16 text-center text-ink-3">Loading…</div>;
  const s = data.summary;

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-2.5">
        <span className="rounded-full border border-warn/30 bg-warn/10 px-2.5 py-1 text-[11px] font-medium text-warn">Paper mode</span>
        <p className="text-xs leading-relaxed text-ink-3">
          Illustrative only — P&L here is never settled to any user&apos;s real balance. Ticks automatically on read, and can also be opened/closed manually below.
        </p>
      </div>

      {error && <p className="text-sm text-neg">{error}</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="panel rounded-2xl p-4">
          <span className="text-[12px] text-ink-3">Open positions</span>
          <p className="tnum mt-2 font-display text-[22px] font-bold text-ink">{s.openPositions}</p>
        </div>
        <div className="panel rounded-2xl p-4">
          <span className="text-[12px] text-ink-3">Copiers · staked</span>
          <p className="tnum mt-2 font-display text-[22px] font-bold text-ink">{s.copiers} · {fmtMoney(s.stakedCents / 100)}</p>
        </div>
        <div className="panel rounded-2xl p-4">
          <span className="text-[12px] text-ink-3">Unrealized P&L</span>
          <p className={cx("tnum mt-2 font-display text-[22px] font-bold", pnlColor(s.unrealizedPnlCents))}>{signed(s.unrealizedPnlCents)}</p>
        </div>
        <div className="panel rounded-2xl p-4">
          <span className="text-[12px] text-ink-3">Realized (all-time)</span>
          <p className={cx("tnum mt-2 font-display text-[22px] font-bold", pnlColor(s.realizedPnlCents))}>{signed(s.realizedPnlCents)}</p>
        </div>
      </div>

      <section className="panel p-5">
        <h2 className="font-display text-lg font-semibold">Open a position</h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-ink-3">Trader</label>
            <select
              value={openTrader}
              onChange={(e) => {
                setOpenTrader(e.target.value);
                setOpenInstrument("");
              }}
              className="mt-1.5 w-56 rounded-lg border border-line bg-raised/60 px-3 py-2 text-sm text-ink focus:border-mint/50 focus:outline-none"
            >
              <option value="">Select a trader…</option>
              {data.traders.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-ink-3">Instrument</label>
            <select
              value={openInstrument}
              onChange={(e) => setOpenInstrument(e.target.value)}
              disabled={!selectedTrader}
              className="mt-1.5 w-40 rounded-lg border border-line bg-raised/60 px-3 py-2 text-sm text-ink focus:border-mint/50 focus:outline-none disabled:opacity-50"
            >
              <option value="">Select…</option>
              {instrumentPool.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-ink-3">Side</label>
            <div className="mt-1.5 flex gap-1.5">
              {(["long", "short"] as const).map((sd) => (
                <button
                  key={sd}
                  onClick={() => setOpenSide(sd)}
                  className={cx(
                    "rounded-lg border px-3 py-2 text-xs font-semibold uppercase transition-colors",
                    openSide === sd ? "border-mint/50 bg-mint/10 text-mint" : "border-line text-ink-2"
                  )}
                >
                  {sd}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={openPosition}
            disabled={openBusy || !openTrader || !openInstrument}
            className="rounded-lg border border-mint/50 bg-mint/10 px-4 py-2 text-sm font-medium text-mint transition-colors disabled:opacity-50"
          >
            {openBusy ? "Opening…" : "Open position"}
          </button>
        </div>
        {selectedTrader && instrumentPool.length === 0 && (
          <p className="mt-2 text-xs text-ink-3">This trader has no tradable markets configured.</p>
        )}
      </section>

      <section className="panel p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Add a provider</h2>
          <button
            onClick={() => setShowAddProvider((v) => !v)}
            className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-mint/50 hover:text-mint"
          >
            {showAddProvider ? "Cancel" : "New provider"}
          </button>
        </div>
        {showAddProvider && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Name" className="rounded-lg border border-line bg-raised/60 px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-mint/50 focus:outline-none" />
            <input value={pCountry} onChange={(e) => setPCountry(e.target.value)} placeholder="Country" className="rounded-lg border border-line bg-raised/60 px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-mint/50 focus:outline-none" />
            <input value={pStrategy} onChange={(e) => setPStrategy(e.target.value)} placeholder="Strategy (e.g. FX Trend Rider)" className="rounded-lg border border-line bg-raised/60 px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-mint/50 focus:outline-none" />
            <select value={pStyle} onChange={(e) => setPStyle(e.target.value)} className="rounded-lg border border-line bg-raised/60 px-3 py-2 text-sm text-ink focus:border-mint/50 focus:outline-none">
              {STYLES.map((s2) => (
                <option key={s2} value={s2}>
                  {s2}
                </option>
              ))}
            </select>
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              {ALL_MARKETS.map((m) => (
                <button
                  key={m}
                  onClick={() => toggleMarket(m)}
                  className={cx(
                    "rounded-full border px-3 py-1.5 text-xs transition-colors",
                    pMarkets.includes(m) ? "border-mint/50 bg-mint/10 text-mint" : "border-line text-ink-2"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <textarea value={pBio} onChange={(e) => setPBio(e.target.value)} placeholder="Short bio" rows={2} className="sm:col-span-2 rounded-lg border border-line bg-raised/60 px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-mint/50 focus:outline-none" />
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-ink-3">Performance fee %</label>
              <input type="number" value={pFee} onChange={(e) => setPFee(e.target.value)} className="tnum mt-1.5 w-full rounded-lg border border-line bg-raised/60 px-3 py-2 text-sm text-ink focus:border-mint/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-ink-3">Min copy (USD)</label>
              <input type="number" value={pMin} onChange={(e) => setPMin(e.target.value)} className="tnum mt-1.5 w-full rounded-lg border border-line bg-raised/60 px-3 py-2 text-sm text-ink focus:border-mint/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-ink-3">Win rate %</label>
              <input type="number" value={pWinRate} onChange={(e) => setPWinRate(e.target.value)} className="tnum mt-1.5 w-full rounded-lg border border-line bg-raised/60 px-3 py-2 text-sm text-ink focus:border-mint/50 focus:outline-none" />
            </div>
            <button
              onClick={submitProvider}
              disabled={addBusy || !pName || !pStrategy || pMarkets.length === 0}
              className="sm:col-span-2 rounded-lg border border-mint/50 bg-mint/10 px-4 py-2 text-sm font-medium text-mint transition-colors disabled:opacity-50"
            >
              {addBusy ? "Adding…" : "Add provider"}
            </button>
            {addMsg && <p className={`sm:col-span-2 text-xs ${addMsg.kind === "ok" ? "text-mint" : "text-neg"}`}>{addMsg.text}</p>}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Open positions ({data.open.length})</h2>
        {data.open.length === 0 ? (
          <div className="panel mt-4 p-8 text-center text-ink-2">No trader currently has an active real allocation.</div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-raised/20">
            <div className="scroll-x">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-3">
                    <th className="px-4 py-3 font-medium">Trader</th>
                    <th className="px-4 py-3 font-medium">Instrument</th>
                    <th className="px-4 py-3 font-medium">Side</th>
                    <th className="px-4 py-3 font-medium">Entry</th>
                    <th className="px-4 py-3 font-medium">Copiers</th>
                    <th className="px-4 py-3 font-medium">Mirrored</th>
                    <th className="px-4 py-3 font-medium">Opened</th>
                    <th className="px-4 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.open.map((p) => (
                    <tr key={p.id} className="border-b border-line-soft last:border-0">
                      <td className="px-4 py-3.5 font-medium text-ink">{p.traderName}</td>
                      <td className="px-4 py-3.5 text-ink-2">{p.instrument}</td>
                      <td className="px-4 py-3.5">
                        <span className={cx("rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase", p.side === "long" ? "bg-pos/15 text-pos" : "bg-neg/15 text-neg")}>{p.side}</span>
                      </td>
                      <td className="tnum px-4 py-3.5 text-ink-2">{p.entryPrice}</td>
                      <td className="tnum px-4 py-3.5 text-ink-2">{p.copierCount}</td>
                      <td className="tnum px-4 py-3.5 text-ink-2">{fmtMoney(p.totalMirroredCents / 100)}</td>
                      <td className="px-4 py-3.5 text-xs text-ink-3">{new Date(p.openedAt).toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => closePosition(p.id)}
                          disabled={busyId === p.id}
                          className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-neg/50 hover:text-neg disabled:opacity-50"
                        >
                          {busyId === p.id ? "…" : "Close"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {data.closed.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold">Recently closed ({data.closed.length})</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-raised/20">
            <div className="scroll-x">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-3">
                    <th className="px-4 py-3 font-medium">Trader</th>
                    <th className="px-4 py-3 font-medium">Instrument</th>
                    <th className="px-4 py-3 font-medium">Side</th>
                    <th className="px-4 py-3 font-medium">Entry → Close</th>
                    <th className="px-4 py-3 font-medium">Copiers</th>
                    <th className="px-4 py-3 font-medium">Mirrored</th>
                    <th className="px-4 py-3 text-right font-medium">Closed</th>
                  </tr>
                </thead>
                <tbody>
                  {data.closed.map((p) => (
                    <tr key={p.id} className="border-b border-line-soft last:border-0">
                      <td className="px-4 py-3.5 font-medium text-ink">{p.traderName}</td>
                      <td className="px-4 py-3.5 text-ink-2">{p.instrument}</td>
                      <td className="px-4 py-3.5">
                        <span className={cx("rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase", p.side === "long" ? "bg-pos/15 text-pos" : "bg-neg/15 text-neg")}>{p.side}</span>
                      </td>
                      <td className="tnum px-4 py-3.5 text-ink-2">{p.entryPrice} → {p.closePrice ?? "—"}</td>
                      <td className="tnum px-4 py-3.5 text-ink-2">{p.copierCount}</td>
                      <td className="tnum px-4 py-3.5 text-ink-2">{fmtMoney(p.totalMirroredCents / 100)}</td>
                      <td className="px-4 py-3.5 text-right text-xs text-ink-3">{p.closedAt ? new Date(p.closedAt).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-lg font-semibold">Copy activity</h2>
        <div className="mt-4"><ActivityTab /></div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Desk</h2>
        <div className="mt-4"><DeskTab /></div>
      </section>

      <section className="panel p-5">
        <h2 className="font-display text-lg font-semibold">Testing dial</h2>
        <p className="mt-1 text-xs text-ink-3">
          Controls position SIZE only — never the outcome. Every position opens and settles at the real market price; nothing here can force a win or a loss.
        </p>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[13px] font-medium text-ink">Risk per trade</p>
          <span className="tnum text-lg font-semibold text-ink">{riskDraft}%</span>
        </div>
        <input type="range" min={1} max={100} step={1} value={riskDraft} onChange={(e) => setRiskDraft(Number(e.target.value))} className="mt-2 w-full accent-fuchsia" />
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={saveDials}
            disabled={dialsBusy || riskDraft === dialsSaved.riskPct}
            className="rounded-lg border border-mint/50 bg-mint/10 px-4 py-2 text-sm font-medium text-mint transition-colors disabled:opacity-50"
          >
            {dialsBusy ? "Saving…" : "Save"}
          </button>
          {dialsMsg && <p className="text-xs text-ink-3">{dialsMsg}</p>}
        </div>
      </section>

      <div className="rounded-2xl border border-warn/30 bg-warn/[0.05] p-4">
        <p className="text-[13px] font-semibold text-warn">Testing tools</p>
        <p className="mb-3 text-[11.5px] text-warn/70">For pre-launch testing only — remove before you go public. No real payment involved.</p>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="user email (blank = all)"
            className="w-56 rounded-lg border border-line bg-raised/60 px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-warn/50 focus:outline-none"
          />
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-ink-3">$</span>
            <input
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              className="w-28 rounded-lg border border-line bg-raised/60 py-2 pl-6 pr-3 text-sm text-ink focus:border-warn/50 focus:outline-none"
            />
          </div>
          <button
            onClick={() => runTest("credit")}
            disabled={testBusy !== null || !testEmail.trim()}
            className="rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-medium text-ink-2 transition-colors hover:border-mint/50 hover:text-mint disabled:opacity-50"
          >
            {testBusy === "credit" ? "…" : "Add test funds"}
          </button>
          <button
            onClick={() => runTest("blow")}
            disabled={testBusy !== null}
            className="rounded-lg border border-neg/40 bg-neg/[0.1] px-3.5 py-2 text-[12.5px] font-semibold text-neg transition-colors hover:bg-neg/[0.18] disabled:opacity-50"
          >
            {testBusy === "blow" ? "…" : `Blow now${testEmail.trim() ? "" : " (all)"}`}
          </button>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-warn/15 pt-2.5">
          <span className="text-[11.5px] text-warn/70">Or blow in</span>
          <div className="relative">
            <input
              value={testMinutes}
              onChange={(e) => setTestMinutes(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              className="w-20 rounded-lg border border-line bg-raised/60 py-2 pl-3 pr-10 text-sm text-ink focus:border-warn/50 focus:outline-none"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-ink-3">min</span>
          </div>
          <button
            onClick={() => runTest("schedule-blow")}
            disabled={testBusy !== null}
            className="rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-medium text-ink-2 transition-colors hover:border-mint/50 hover:text-mint disabled:opacity-50"
          >
            {testBusy === "schedule-blow" ? "…" : "Set timer"}
          </button>
          <button onClick={() => runTest("cancel-blow")} disabled={testBusy !== null} className="text-[12px] font-medium text-ink-3 underline-offset-2 hover:text-ink hover:underline">
            Cancel timer
          </button>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-warn/15 pt-2.5">
          <span className="text-[11.5px] text-warn/70">Auto-blow each account</span>
          <div className="relative">
            <input
              value={autoBlowDraft}
              onChange={(e) => setAutoBlowDraft(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              placeholder="0"
              className="w-20 rounded-lg border border-line bg-raised/60 py-2 pl-3 pr-12 text-sm text-ink focus:border-warn/50 focus:outline-none"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-ink-3">days</span>
          </div>
          <span className="text-[11.5px] text-warn/70">after it starts copying</span>
          <button onClick={saveAutoBlow} disabled={autoBlowBusy} className="rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-medium text-ink-2 transition-colors hover:border-mint/50 hover:text-mint disabled:opacity-50">
            {autoBlowBusy ? "…" : "Save"}
          </button>
          <span className="text-[11px] text-ink-3">
            {savedAutoBlow != null && savedAutoBlow > 0
              ? `On — every account blows ${savedAutoBlow} day${savedAutoBlow === 1 ? "" : "s"} after it starts.`
              : "Off (0). Set >0 to auto-blow. Tip: 0.02 ≈ 30 min for fast tests."}
          </span>
        </div>
        {testMsg && <p className="mt-2 text-[12px] text-warn">{testMsg}</p>}
      </div>
    </div>
  );
}
