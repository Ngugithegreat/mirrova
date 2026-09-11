"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccountState } from "@/lib/accountClient";
import { useDeskState, desk } from "@/lib/deskClient";
import { INSTRUMENTS } from "@/lib/instruments";
import { ACCOUNT_TYPES, unlockedDeskInstruments } from "@/lib/accountTypes";
import { candles } from "@/lib/deskMarket";
import CandleChart from "./CandleChart";
import { fmtMoney, cx } from "@/lib/format";

function decimalsFor(sym: string) {
  return INSTRUMENTS.find((i) => i.sym === sym)?.decimals ?? 2;
}

function typeThatUnlocks(sym: string, currentId: string) {
  return ACCOUNT_TYPES.find((t) => t.id !== currentId && unlockedDeskInstruments(t).includes(sym));
}

export default function Desk() {
  const account = useAccountState();
  const deskState = useDeskState();

  const [sym, setSym] = useState(INSTRUMENTS[0].sym);
  const [side, setSide] = useState<"long" | "short">("long");
  const [stake, setStake] = useState(100);
  const [useSlTp, setUseSlTp] = useState(false);
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const chartCandles = useMemo(() => (now ? candles(sym, 60, now) : []), [sym, now]);
  const livePrice = chartCandles.length ? chartCandles[chartCandles.length - 1].c : null;

  if (!account.ready || !account.user || !deskState.ready) {
    return <div className="mx-auto max-w-6xl px-5 py-24 text-center text-ink-3">Loading the Desk…</div>;
  }

  const accountType = account.accountType;
  const isUnlocked = (s: string) => accountType?.deskInstruments.includes(s) ?? false;
  const decimals = decimalsFor(sym);

  async function submit() {
    setError(null);
    if (!isUnlocked(sym)) {
      setError("This instrument isn't available on your account type.");
      return;
    }
    setBusy(true);
    try {
      await desk.open(
        sym,
        side,
        Math.round(stake * 100),
        useSlTp && sl ? Number(sl) : undefined,
        useSlTp && tp ? Number(tp) : undefined
      );
      setSl("");
      setTp("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleClose(id: string) {
    setBusy(true);
    try {
      await desk.close(id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">The Desk</h1>
            <span className="rounded-full border border-warn/40 bg-warn/10 px-2.5 py-1 text-[11px] font-medium text-warn">
              Practice — simulated leverage, no real funds at risk
            </span>
          </div>
          <p className="mt-2 text-sm text-ink-2">
            Self-directed positions, settled against your $
            {(account.cashCents / 100).toLocaleString()} practice balance.
          </p>
        </div>
        {accountType && (
          <div className="text-right text-sm text-ink-2">
            <span className="rounded-full border border-mint/30 bg-mint/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-mint">
              {accountType.name}
            </span>{" "}
            1:{accountType.maxLeverage} · {accountType.deskInstruments.length} instruments
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {INSTRUMENTS.map((i) => {
          const unlocked = isUnlocked(i.sym);
          const lockLabel = !unlocked ? typeThatUnlocks(i.sym, accountType?.id ?? "standard")?.name ?? "" : "";
          return (
            <button
              key={i.sym}
              onClick={() => unlocked && setSym(i.sym)}
              disabled={!unlocked}
              className={cx(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                sym === i.sym && unlocked
                  ? "border-mint/50 bg-mint/10 text-mint"
                  : unlocked
                    ? "border-line text-ink-2 hover:text-ink"
                    : "cursor-not-allowed border-line-soft text-ink-3 opacity-60"
              )}
              title={unlocked ? undefined : `Unlocks at ${lockLabel}`}
            >
              {i.sym}
              {!unlocked && <span className="ml-1.5 text-[9px] uppercase tracking-wide">{lockLabel}</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="panel p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold">{sym}</h2>
            {livePrice != null && <span className="tnum text-xl font-semibold text-ink">{livePrice.toFixed(decimals)}</span>}
          </div>
          <div className="mt-4">
            {chartCandles.length > 0 && <CandleChart candles={chartCandles} decimals={decimals} />}
          </div>
        </div>

        <div className="panel p-6">
          <h3 className="font-display text-base font-semibold">Order ticket</h3>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => setSide("long")}
              className={cx(
                "rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors",
                side === "long" ? "border-pos/50 bg-pos/10 text-pos" : "border-line text-ink-2"
              )}
            >
              Long
            </button>
            <button
              onClick={() => setSide("short")}
              className={cx(
                "rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors",
                side === "short" ? "border-neg/50 bg-neg/10 text-neg" : "border-line text-ink-2"
              )}
            >
              Short
            </button>
          </div>

          <label className="mt-5 block text-xs font-medium uppercase tracking-wide text-ink-3">Stake (USD)</label>
          <div className="mt-2 flex items-center gap-2">
            {[100, 500, 2000].map((v) => (
              <button
                key={v}
                onClick={() => setStake(v)}
                className={cx(
                  "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                  stake === v ? "border-mint/50 bg-mint/10 text-mint" : "border-line text-ink-2 hover:text-ink"
                )}
              >
                ${v.toLocaleString()}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={10}
            step={10}
            value={stake}
            onChange={(e) => setStake(Number(e.target.value))}
            className="tnum mt-2.5 w-full rounded-xl border border-line bg-raised/60 px-4 py-3 text-lg font-semibold text-ink focus:border-mint/50 focus:outline-none"
          />

          {accountType && (
            <p className="mt-2 text-xs text-ink-3">
              At 1:{accountType.maxLeverage} leverage, exposure is{" "}
              <span className="tnum text-ink-2">{fmtMoney(stake * accountType.maxLeverage)}</span>.
            </p>
          )}

          <label className="mt-5 flex items-center gap-2 text-sm text-ink-2">
            <input
              type="checkbox"
              checked={useSlTp}
              disabled={!accountType?.deskOrdersWithSlTp}
              onChange={(e) => setUseSlTp(e.target.checked)}
              className="h-4 w-4 accent-[#22d3ee]"
            />
            Stop-loss / take-profit
            {!accountType?.deskOrdersWithSlTp && <span className="text-xs text-ink-3">(needs a different account type)</span>}
          </label>
          {useSlTp && accountType?.deskOrdersWithSlTp && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Stop-loss price"
                value={sl}
                onChange={(e) => setSl(e.target.value)}
                className="tnum rounded-lg border border-line bg-raised/60 px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-mint/50 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Take-profit price"
                value={tp}
                onChange={(e) => setTp(e.target.value)}
                className="tnum rounded-lg border border-line bg-raised/60 px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-mint/50 focus:outline-none"
              />
            </div>
          )}

          {error && <p className="mt-3 text-sm text-neg">{error}</p>}

          <button
            onClick={submit}
            disabled={busy || !isUnlocked(sym)}
            className="sheen relative mt-5 w-full overflow-hidden rounded-full bg-gradient-to-r from-violet via-mint to-fuchsia py-3.5 text-sm font-semibold text-[#06060c] disabled:opacity-60"
          >
            {busy ? "Please wait…" : `Open ${side} position`}
          </button>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl font-semibold">Open positions ({deskState.open.length})</h2>
        {deskState.open.length === 0 ? (
          <div className="panel mt-4 p-10 text-center text-ink-2">No open positions yet.</div>
        ) : (
          <div className="mt-4 space-y-3">
            {deskState.open.map((p) => (
              <div key={p.id} className="panel flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3">
                  <span
                    className={cx(
                      "rounded-md px-2 py-1 text-xs font-bold uppercase",
                      p.side === "long" ? "bg-pos/15 text-pos" : "bg-neg/15 text-neg"
                    )}
                  >
                    {p.side}
                  </span>
                  <div>
                    <div className="font-medium text-ink">{p.instrument}</div>
                    <div className="text-xs text-ink-3">
                      {fmtMoney(p.stakeUsdCents / 100)} · 1:{p.leverage} · entry {p.entryPrice.toFixed(decimalsFor(p.instrument))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="tnum text-xs text-ink-3">Current {p.price.toFixed(decimalsFor(p.instrument))}</div>
                  <div className={cx("tnum text-lg font-semibold", p.unrealizedPnlCents >= 0 ? "text-pos" : "text-neg")}>
                    {p.unrealizedPnlCents >= 0 ? "+" : "−"}
                    {fmtMoney(Math.abs(p.unrealizedPnlCents) / 100, 2)}
                  </div>
                </div>
                <button
                  onClick={() => handleClose(p.id)}
                  disabled={busy}
                  className="rounded-lg border border-line px-3.5 py-2 text-xs text-ink-2 transition-colors hover:border-neg/50 hover:text-neg disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {deskState.closed.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl font-semibold">Recently closed</h2>
          <div className="panel mt-4 divide-y divide-line-soft">
            {deskState.closed.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 px-6 py-4 text-sm">
                <span className="text-ink-2">
                  {p.side} {p.instrument} · {fmtMoney(p.stakeUsdCents / 100)} · 1:{p.leverage}
                </span>
                <span className={cx("tnum font-semibold", (p.pnlCents ?? 0) >= 0 ? "text-pos" : "text-neg")}>
                  {(p.pnlCents ?? 0) >= 0 ? "+" : "−"}
                  {fmtMoney(Math.abs(p.pnlCents ?? 0) / 100, 2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-10 text-xs leading-relaxed text-ink-3">
        The Desk is a practice feature: prices are simulated, leverage is simulated, and no real funds are
        ever at risk here. It settles only against your practice balance, never your real wallet.
      </p>
    </div>
  );
}
