"use client";

import { useEffect, useState } from "react";
import { useAccountState } from "@/lib/accountClient";
import { useRealAccountState, type EngineClosedPosition } from "@/lib/realAccountClient";
import { useSessionMode } from "@/lib/sessionMode";
import { getTrader } from "@/lib/traders";
import { fmtMoney, cx, timeAgo } from "@/lib/format";
import AllocationBars from "@/components/charts/AllocationBars";
import { ButtonLink } from "@/components/ui/Button";

function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const csv = [header, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function StatTile({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return (
    <div className="panel p-5">
      <div className="text-[11px] uppercase tracking-wide text-ink-3">{label}</div>
      <div className={cx("tnum mt-1.5 text-2xl font-semibold", tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : "text-ink")}>
        {value}
      </div>
    </div>
  );
}

function DemoPortfolio() {
  const state = useAccountState();
  if (!state.ready || !state.user) {
    return <div className="mx-auto max-w-6xl px-5 py-24 text-center text-ink-3">Loading portfolio…</div>;
  }

  const wins = state.closedCopies.filter((c) => c.pnlCents > 0);
  const losses = state.closedCopies.filter((c) => c.pnlCents <= 0);
  const unrealized = state.copies.reduce((s, c) => s + (c.currentValueCents - c.amountCents), 0);
  const lifetimePnl = state.closedCopies.reduce((s, c) => s + c.pnlCents, 0) + unrealized;
  const winRate = state.closedCopies.length ? (wins.length / state.closedCopies.length) * 100 : null;
  const avgWin = wins.length ? wins.reduce((s, c) => s + c.pnlCents, 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((s, c) => s + c.pnlCents, 0) / losses.length : 0;
  const best = [...state.closedCopies].sort((a, b) => b.pnlCents - a.pnlCents)[0];
  const worst = [...state.closedCopies].sort((a, b) => a.pnlCents - b.pnlCents)[0];

  const investedTotal = state.copies.reduce((s, c) => s + c.currentValueCents, 0);
  const grandTotal = state.cashCents + investedTotal;
  const allocation =
    grandTotal > 0
      ? [
          ...state.copies.map((c) => ({
            label: getTrader(c.slug)?.name ?? c.slug,
            pct: Math.round((c.currentValueCents / grandTotal) * 100),
          })),
          { label: "Cash", pct: Math.round((state.cashCents / grandTotal) * 100) },
        ]
      : [];

  function exportCsv() {
    downloadCsv(
      "asport-traders-demo-portfolio.csv",
      ["Trader", "Status", "Invested", "Value", "P&L", "Started", "Stopped"],
      [
        ...state.copies.map((c) => [getTrader(c.slug)?.name ?? c.slug, "Open", c.amountCents / 100, c.currentValueCents / 100, (c.currentValueCents - c.amountCents) / 100, c.startedAt, ""]),
        ...state.closedCopies.map((c) => [getTrader(c.slug)?.name ?? c.slug, "Closed", c.amountCents / 100, c.valueCents / 100, c.pnlCents / 100, c.startedAt, c.stoppedAt]),
      ]
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-3">
            <span className="rounded-full border border-warn/40 bg-warn/10 px-2 py-0.5 text-[11px] font-medium text-warn">Practice mode</span>
          </p>
          <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight">Portfolio</h1>
        </div>
        <button onClick={exportCsv} className="rounded-lg border border-line px-3.5 py-2 text-xs text-ink-2 transition-colors hover:border-mint/50 hover:text-mint">
          Export CSV
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Lifetime P&L" value={`${lifetimePnl >= 0 ? "+" : "−"}${fmtMoney(Math.abs(lifetimePnl) / 100, 2)}`} tone={lifetimePnl >= 0 ? "pos" : "neg"} />
        <StatTile label="Win rate" value={winRate == null ? "—" : `${winRate.toFixed(0)}%`} />
        <StatTile label="Avg win" value={fmtMoney(avgWin / 100, 2)} tone="pos" />
        <StatTile label="Avg loss" value={fmtMoney(Math.abs(avgLoss) / 100, 2)} tone="neg" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="panel p-6">
          <h2 className="font-display text-lg font-semibold">Best &amp; worst closed copy</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-ink-3">Best</div>
              {best ? (
                <>
                  <div className="mt-1 font-medium text-ink">{getTrader(best.slug)?.name ?? best.slug}</div>
                  <div className="tnum text-pos">+{fmtMoney(best.pnlCents / 100, 2)}</div>
                </>
              ) : (
                <div className="mt-1 text-sm text-ink-3">No closed copies yet.</div>
              )}
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-ink-3">Worst</div>
              {worst ? (
                <>
                  <div className="mt-1 font-medium text-ink">{getTrader(worst.slug)?.name ?? worst.slug}</div>
                  <div className="tnum text-neg">{fmtMoney(worst.pnlCents / 100, 2)}</div>
                </>
              ) : (
                <div className="mt-1 text-sm text-ink-3">No closed copies yet.</div>
              )}
            </div>
          </div>
        </div>
        <div className="panel p-6">
          <h2 className="font-display text-lg font-semibold">Exposure</h2>
          <div className="mt-4">
            {allocation.length > 0 ? <AllocationBars allocation={allocation} /> : <p className="text-sm text-ink-3">Nothing allocated yet.</p>}
          </div>
        </div>
      </div>

      <h2 className="font-display mt-10 text-xl font-semibold">Open ({state.copies.length})</h2>
      {state.copies.length === 0 ? (
        <div className="panel mt-4 p-8 text-center text-sm text-ink-3">Nothing open.</div>
      ) : (
        <div className="panel mt-4 divide-y divide-line-soft">
          {state.copies.map((c) => (
            <div key={c.slug} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm">
              <span className="font-medium text-ink">{getTrader(c.slug)?.name ?? c.slug}</span>
              <span className="tnum text-ink-2">{fmtMoney(c.currentValueCents / 100, 2)}</span>
              <span className={cx("tnum font-medium", c.currentValueCents - c.amountCents >= 0 ? "text-pos" : "text-neg")}>
                {c.currentValueCents - c.amountCents >= 0 ? "+" : "−"}
                {fmtMoney(Math.abs(c.currentValueCents - c.amountCents) / 100, 2)}
              </span>
              <span className="text-xs text-ink-3">{timeAgo(c.startedAt)}</span>
            </div>
          ))}
        </div>
      )}

      <h2 className="font-display mt-10 text-xl font-semibold">History ({state.closedCopies.length})</h2>
      {state.closedCopies.length === 0 ? (
        <div className="panel mt-4 p-8 text-center text-sm text-ink-3">Nothing closed yet.</div>
      ) : (
        <div className="panel mt-4 divide-y divide-line-soft">
          {state.closedCopies.map((c, i) => (
            <div key={i} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm">
              <span className="font-medium text-ink">{getTrader(c.slug)?.name ?? c.slug}</span>
              <span className="tnum text-ink-2">{fmtMoney(c.valueCents / 100, 2)}</span>
              <span className={cx("tnum font-medium", c.pnlCents >= 0 ? "text-pos" : "text-neg")}>
                {c.pnlCents >= 0 ? "+" : "−"}
                {fmtMoney(Math.abs(c.pnlCents) / 100, 2)}
              </span>
              <span className="text-xs text-ink-3">{timeAgo(c.stoppedAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RealPortfolio() {
  const account = useAccountState();
  const real = useRealAccountState();
  const [closedPositions, setClosedPositions] = useState<EngineClosedPosition[] | null>(null);

  useEffect(() => {
    fetch("/api/real/portfolio")
      .then((r) => r.json())
      .then((d) => setClosedPositions(d.closedPositions ?? []))
      .catch(() => setClosedPositions([]));
  }, []);

  if (!account.ready || !account.user || !real.ready || !closedPositions) {
    return <div className="mx-auto max-w-6xl px-5 py-24 text-center text-ink-3">Loading portfolio…</div>;
  }
  const closed = closedPositions;

  const wins = closed.filter((p) => p.realizedPnlCents > 0);
  const losses = closed.filter((p) => p.realizedPnlCents <= 0);
  const lifetimePnl = closed.reduce((s, p) => s + p.realizedPnlCents, 0) + (real.engine.open?.unrealizedPnlCents ?? 0);
  const winRate = closed.length ? (wins.length / closed.length) * 100 : null;
  const avgWin = wins.length ? wins.reduce((s, p) => s + p.realizedPnlCents, 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((s, p) => s + p.realizedPnlCents, 0) / losses.length : 0;
  const best = [...closed].sort((a, b) => b.realizedPnlCents - a.realizedPnlCents)[0];
  const worst = [...closed].sort((a, b) => a.realizedPnlCents - b.realizedPnlCents)[0];
  const allocTrader = real.allocation ? getTrader(real.allocation.slug) : null;

  function exportCsv() {
    downloadCsv(
      "asport-traders-real-portfolio.csv",
      ["Instrument", "Side", "Status", "Size", "P&L", "Closed"],
      [
        ...(real.engine.open ? [[real.engine.open.instrument, real.engine.open.side, "Open", real.engine.open.sizeUsdCents / 100, real.engine.open.unrealizedPnlCents / 100, ""]] : []),
        ...closed.map((p) => [p.instrument, p.side, "Closed", p.sizeUsdCents / 100, p.realizedPnlCents / 100, p.closedAt ?? ""]),
      ]
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-3">
            <span className="rounded-full border border-mint/40 bg-mint/10 px-2 py-0.5 text-[11px] font-medium text-mint">Real account</span>
          </p>
          <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight">Portfolio</h1>
        </div>
        <button onClick={exportCsv} className="rounded-lg border border-line px-3.5 py-2 text-xs text-ink-2 transition-colors hover:border-mint/50 hover:text-mint">
          Export CSV
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Illustrative lifetime P&L" value={`${lifetimePnl >= 0 ? "+" : "−"}${fmtMoney(Math.abs(lifetimePnl) / 100, 2)}`} tone={lifetimePnl >= 0 ? "pos" : "neg"} />
        <StatTile label="Win rate" value={winRate == null ? "—" : `${winRate.toFixed(0)}%`} />
        <StatTile label="Avg win" value={fmtMoney(avgWin / 100, 2)} tone="pos" />
        <StatTile label="Avg loss" value={fmtMoney(Math.abs(avgLoss) / 100, 2)} tone="neg" />
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
        Illustrative — this simulated P&amp;L is never settled to your real balance.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="panel p-6">
          <h2 className="font-display text-lg font-semibold">Best &amp; worst closed position</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-ink-3">Best</div>
              {best ? (
                <>
                  <div className="mt-1 font-medium text-ink">{best.side === "long" ? "Long" : "Short"} {best.instrument}</div>
                  <div className="tnum text-pos">+{fmtMoney(best.realizedPnlCents / 100, 2)}</div>
                </>
              ) : (
                <div className="mt-1 text-sm text-ink-3">No closed positions yet.</div>
              )}
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-ink-3">Worst</div>
              {worst ? (
                <>
                  <div className="mt-1 font-medium text-ink">{worst.side === "long" ? "Long" : "Short"} {worst.instrument}</div>
                  <div className="tnum text-neg">{fmtMoney(worst.realizedPnlCents / 100, 2)}</div>
                </>
              ) : (
                <div className="mt-1 text-sm text-ink-3">No closed positions yet.</div>
              )}
            </div>
          </div>
        </div>
        <div className="panel p-6">
          <h2 className="font-display text-lg font-semibold">Allocation</h2>
          {allocTrader && real.allocation ? (
            <div className="mt-4">
              <div className="font-medium text-ink">{allocTrader.name}</div>
              <div className="tnum mt-1 text-lg font-semibold text-ink">{fmtMoney(real.allocation.amountCents / 100, 2)}</div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-3">
              Nothing allocated yet. <ButtonLink href="/wallet" size="sm" className="mt-3">Go to Wallet</ButtonLink>
            </p>
          )}
        </div>
      </div>

      <h2 className="font-display mt-10 text-xl font-semibold">Open</h2>
      {!real.engine.open ? (
        <div className="panel mt-4 p-8 text-center text-sm text-ink-3">Nothing open.</div>
      ) : (
        <div className="panel mt-4 divide-y divide-line-soft">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm">
            <span className="font-medium text-ink">{real.engine.open.side === "long" ? "Long" : "Short"} {real.engine.open.instrument}</span>
            <span className="tnum text-ink-2">{fmtMoney(real.engine.open.sizeUsdCents / 100, 2)}</span>
            <span className={cx("tnum font-medium", real.engine.open.unrealizedPnlCents >= 0 ? "text-pos" : "text-neg")}>
              {real.engine.open.unrealizedPnlCents >= 0 ? "+" : "−"}
              {fmtMoney(Math.abs(real.engine.open.unrealizedPnlCents) / 100, 2)}
            </span>
            <span className="text-xs text-ink-3">{timeAgo(real.engine.open.openedAt)}</span>
          </div>
        </div>
      )}

      <h2 className="font-display mt-10 text-xl font-semibold">History ({closedPositions.length})</h2>
      {closedPositions.length === 0 ? (
        <div className="panel mt-4 p-8 text-center text-sm text-ink-3">Nothing closed yet.</div>
      ) : (
        <div className="panel mt-4 divide-y divide-line-soft">
          {closedPositions.map((p, i) => (
            <div key={i} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm">
              <span className="font-medium text-ink">{p.side === "long" ? "Long" : "Short"} {p.instrument}</span>
              <span className="tnum text-ink-2">{fmtMoney(p.sizeUsdCents / 100, 2)}</span>
              <span className={cx("tnum font-medium", p.realizedPnlCents >= 0 ? "text-pos" : "text-neg")}>
                {p.realizedPnlCents >= 0 ? "+" : "−"}
                {fmtMoney(Math.abs(p.realizedPnlCents) / 100, 2)}
              </span>
              <span className="text-xs text-ink-3">{p.closedAt ? timeAgo(p.closedAt) : "—"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Portfolio() {
  const mode = useSessionMode();
  return mode === "real" ? <RealPortfolio /> : <DemoPortfolio />;
}
