"use client";

import { useEffect, useState } from "react";
import { fmtMoney, cx } from "@/lib/format";

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

type EngineData = { open: Position[]; closed: Position[]; traders: TraderOption[] };

const CATEGORY_INSTRUMENTS: Record<string, string[]> = {
  Stocks: ["AAPL"],
  Crypto: ["BTC/USD", "ETH/USD"],
  Forex: ["EUR/USD", "GBP/USD", "USD/JPY"],
  Indices: ["S&P 500", "NASDAQ 100", "DAX 40"],
  Commodities: ["GOLD", "CRUDE OIL", "SILVER"],
};

const STYLES = ["Conservative", "Balanced", "Aggressive"];
const ALL_MARKETS = ["Stocks", "Crypto", "Forex", "Indices", "Commodities"];

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

  function load() {
    fetch("/api/admin/engine")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData({ open: [], closed: [], traders: [] }));
  }

  useEffect(load, []);

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

  if (!data) return <div className="py-16 text-center text-ink-3">Loading…</div>;

  return (
    <div className="space-y-10">
      <p className="text-xs leading-relaxed text-ink-3">
        Illustrative only — P&L here is never settled to any user&apos;s real balance. Ticks automatically on read,
        and can also be opened/closed manually below.
      </p>

      {error && <p className="text-sm text-neg">{error}</p>}

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
              {(["long", "short"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setOpenSide(s)}
                  className={cx(
                    "rounded-lg border px-3 py-2 text-xs font-semibold uppercase transition-colors",
                    openSide === s ? "border-mint/50 bg-mint/10 text-mint" : "border-line text-ink-2"
                  )}
                >
                  {s}
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
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {s}
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
          <div className="scroll-x mt-4">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-3">
                  <th className="py-3 pr-4 font-medium">Trader</th>
                  <th className="py-3 pr-4 font-medium">Instrument</th>
                  <th className="py-3 pr-4 font-medium">Side</th>
                  <th className="py-3 pr-4 font-medium">Entry</th>
                  <th className="py-3 pr-4 font-medium">Copiers</th>
                  <th className="py-3 pr-4 font-medium">Mirrored</th>
                  <th className="py-3 pr-4 font-medium">Opened</th>
                  <th className="py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.open.map((p) => (
                  <tr key={p.id} className="border-b border-line-soft last:border-0">
                    <td className="py-3.5 pr-4 font-medium text-ink">{p.traderName}</td>
                    <td className="py-3.5 pr-4 text-ink-2">{p.instrument}</td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={cx(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase",
                          p.side === "long" ? "bg-pos/15 text-pos" : "bg-neg/15 text-neg"
                        )}
                      >
                        {p.side}
                      </span>
                    </td>
                    <td className="tnum py-3.5 pr-4 text-ink-2">{p.entryPrice}</td>
                    <td className="tnum py-3.5 pr-4 text-ink-2">{p.copierCount}</td>
                    <td className="tnum py-3.5 pr-4 text-ink-2">{fmtMoney(p.totalMirroredCents / 100)}</td>
                    <td className="py-3.5 pr-4 text-xs text-ink-3">{new Date(p.openedAt).toLocaleString()}</td>
                    <td className="py-3.5 text-right">
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
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Recently closed ({data.closed.length})</h2>
        {data.closed.length === 0 ? (
          <div className="panel mt-4 p-8 text-center text-ink-2">Nothing closed yet.</div>
        ) : (
          <div className="scroll-x mt-4">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-3">
                  <th className="py-3 pr-4 font-medium">Trader</th>
                  <th className="py-3 pr-4 font-medium">Instrument</th>
                  <th className="py-3 pr-4 font-medium">Side</th>
                  <th className="py-3 pr-4 font-medium">Entry → Close</th>
                  <th className="py-3 pr-4 font-medium">Copiers</th>
                  <th className="py-3 pr-4 font-medium">Mirrored</th>
                  <th className="py-3 text-right font-medium">Closed</th>
                </tr>
              </thead>
              <tbody>
                {data.closed.map((p) => (
                  <tr key={p.id} className="border-b border-line-soft last:border-0">
                    <td className="py-3.5 pr-4 font-medium text-ink">{p.traderName}</td>
                    <td className="py-3.5 pr-4 text-ink-2">{p.instrument}</td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={cx(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase",
                          p.side === "long" ? "bg-pos/15 text-pos" : "bg-neg/15 text-neg"
                        )}
                      >
                        {p.side}
                      </span>
                    </td>
                    <td className="tnum py-3.5 pr-4 text-ink-2">
                      {p.entryPrice} → {p.closePrice ?? "—"}
                    </td>
                    <td className="tnum py-3.5 pr-4 text-ink-2">{p.copierCount}</td>
                    <td className="tnum py-3.5 pr-4 text-ink-2">{fmtMoney(p.totalMirroredCents / 100)}</td>
                    <td className="py-3.5 text-right text-xs text-ink-3">{p.closedAt ? new Date(p.closedAt).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
