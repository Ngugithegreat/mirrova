"use client";

import { useState } from "react";
import Link from "next/link";
import { account, useAccountState } from "@/lib/accountClient";
import { getTrader, traderStats, equitySeries } from "@/lib/traders";
import { fmtMoney, fmtPct } from "@/lib/format";
import TraderAvatar from "@/components/ui/TraderAvatar";
import RiskMeter from "@/components/ui/RiskMeter";
import Sparkline from "@/components/charts/Sparkline";
import { ButtonLink } from "@/components/ui/Button";
import CountUp from "@/components/motion/CountUp";
import LiveSignalBadge from "@/components/traders/LiveSignalBadge";

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Portfolio() {
  const state = useAccountState();
  const [stopping, setStopping] = useState<string | null>(null);

  if (!state.ready) {
    return <div className="mx-auto max-w-6xl px-5 py-24 text-center text-ink-3">Loading portfolio…</div>;
  }

  if (!state.user) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold">Your portfolio awaits</h1>
        <p className="mt-4 text-ink-2">Create a free account to start copying with a $100,000 practice balance.</p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/signup">Create account</ButtonLink>
          <ButtonLink href="/login" variant="secondary">Log in</ButtonLink>
        </div>
      </div>
    );
  }

  const positions = state.copies.map((c) => {
    const t = getTrader(c.slug)!;
    const amount = c.amountCents / 100;
    const value = c.currentValueCents / 100;
    return { c, t, amount, value, pnl: value - amount, pnlPct: ((value - amount) / amount) * 100 };
  });
  const invested = positions.reduce((s, p) => s + p.value, 0);
  const cash = state.cashCents / 100;
  const total = cash + invested;
  const totalPnl = positions.reduce((s, p) => s + p.pnl, 0);

  async function handleStop(slug: string) {
    setStopping(slug);
    try {
      await account.stopCopy(slug);
    } finally {
      setStopping(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-3">
            Welcome back, {state.user.name.split(" ")[0]}
            <span className="ml-2 rounded-full border border-warn/40 bg-warn/10 px-2 py-0.5 text-[11px] font-medium text-warn">
              Practice mode
            </span>
          </p>
          <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight">Portfolio</h1>
        </div>
        <Link href="/wallet" className="text-sm font-medium text-mint transition-colors hover:underline">
          Real wallet →
        </Link>
      </div>

      {state.accountType && (
        <Link
          href="/pricing#account-types"
          className="panel mt-6 flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:border-mint/30"
        >
          <div className="flex items-center gap-2.5 text-sm">
            <span className="rounded-full border border-mint/30 bg-mint/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-mint">
              {state.accountType.name}
            </span>
            <span className="text-ink-2">
              <span className="tnum">{positions.length}</span> /{" "}
              <span className="tnum">{state.accountType.maxConcurrentCopies >= 999 ? "∞" : state.accountType.maxConcurrentCopies}</span> copy
              slots used
            </span>
          </div>
          <span className="text-xs font-medium text-mint">Compare account types →</span>
        </Link>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="panel glow-ring p-6">
          <div className="text-[11px] uppercase tracking-wide text-ink-3">Total value</div>
          <div className="tnum mt-1.5 font-display text-3xl font-semibold text-ink">
            <CountUp value={total} format="money" duration={1200} />
          </div>
        </div>
        <div className="panel p-6">
          <div className="text-[11px] uppercase tracking-wide text-ink-3">Available cash</div>
          <div className="tnum mt-1.5 font-display text-3xl font-semibold text-ink">
            <CountUp value={cash} format="money" duration={1200} />
          </div>
        </div>
        <div className="panel p-6">
          <div className="text-[11px] uppercase tracking-wide text-ink-3">Copy P&L</div>
          <div className={`tnum mt-1.5 font-display text-3xl font-semibold ${totalPnl >= 0 ? "text-pos" : "text-neg"}`}>
            {totalPnl >= 0 ? "+" : "−"}{fmtMoney(Math.abs(totalPnl), 2)}
          </div>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Active copies ({positions.length})</h2>
        <ButtonLink href="/traders" variant="secondary" size="sm">
          + Copy another trader
        </ButtonLink>
      </div>

      {positions.length === 0 ? (
        <div className="panel mt-4 p-12 text-center">
          <p className="text-lg text-ink-2">You&apos;re not copying anyone yet.</p>
          <p className="mt-2 text-sm text-ink-3">Browse the leaderboard and put your practice balance to work.</p>
          <div className="mt-6">
            <ButtonLink href="/traders">Browse top traders</ButtonLink>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {positions.map(({ c, t, amount, value, pnl, pnlPct }, i) => {
            const s = traderStats(t);
            const eq = equitySeries(t).filter((_, i) => i % 2 === 0).slice(-40);
            return (
              <div
                key={c.slug}
                className="panel panel-hover row-in flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <Link href={`/traders/${c.slug}`} className="flex items-center gap-4">
                  <TraderAvatar name={t.name} />
                  <div>
                    <div className="font-medium text-ink">{t.name}</div>
                    <div className="mt-0.5 text-xs text-ink-3">{t.strategy}</div>
                    <div className="mt-1.5"><RiskMeter score={t.riskScore} showLabel={false} /></div>
                    <div className="mt-1.5"><LiveSignalBadge trader={t} /></div>
                  </div>
                </Link>
                <Sparkline data={eq} id={`dash-${c.slug}`} width={120} height={40} positive={s.return12m >= 0} />
                <div className="grid grid-cols-3 gap-6 lg:text-right">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-ink-3">Invested</div>
                    <div className="tnum mt-0.5 font-semibold text-ink">{fmtMoney(amount)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-ink-3">Value</div>
                    <div className="tnum mt-0.5 font-semibold text-ink">{fmtMoney(value, 2)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-ink-3">P&L</div>
                    <div className={`tnum mt-0.5 font-semibold ${pnl >= 0 ? "text-pos" : "text-neg"}`}>
                      {fmtPct(pnlPct, { digits: 2 })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-ink-3">
                    Stop-loss <span className="tnum text-ink-2">−{c.stopLossPct}%</span>
                  </div>
                  <button
                    onClick={() => handleStop(c.slug)}
                    disabled={stopping === c.slug}
                    className="rounded-lg border border-line px-3.5 py-2 text-xs text-ink-2 transition-colors hover:border-neg/50 hover:text-neg disabled:opacity-50"
                  >
                    {stopping === c.slug ? "Stopping…" : "Stop copying"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {state.activity.length > 0 && (
        <>
          <h2 className="font-display mt-12 text-xl font-semibold">Activity</h2>
          <div className="panel mt-4 divide-y divide-line-soft">
            {state.activity.slice(0, 8).map((a, i) => (
              <div key={i} className="flex items-center justify-between gap-4 px-6 py-4 text-sm">
                <span className="text-ink-2">{a.text}</span>
                <span className="shrink-0 text-xs text-ink-3">{timeAgo(a.createdAt)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="mt-10 text-xs leading-relaxed text-ink-3">
        Practice mode simulates copy performance from each trader&apos;s recent pace; figures refresh daily
        and are illustrative only.
      </p>
    </div>
  );
}
