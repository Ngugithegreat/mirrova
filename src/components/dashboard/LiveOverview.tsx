"use client";

import Link from "next/link";
import { useAccountState } from "@/lib/accountClient";
import { useRealAccountState } from "@/lib/realAccountClient";
import { getTrader } from "@/lib/traders";
import { fmtMoney, cx, timeAgo, greeting } from "@/lib/format";
import { ButtonLink } from "@/components/ui/Button";
import TraderAvatar from "@/components/ui/TraderAvatar";
import LiveSignalBadge from "@/components/traders/LiveSignalBadge";

export default function LiveOverview() {
  const account = useAccountState();
  const real = useRealAccountState();

  if (!account.ready || !account.user || !real.ready) {
    return <div className="mx-auto max-w-4xl px-5 py-24 text-center text-ink-3">Loading overview…</div>;
  }

  const allocTrader = real.allocation ? getTrader(real.allocation.slug) : null;
  const accountValue = real.realCashCents + (real.allocation?.amountCents ?? 0);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 lg:px-8">
      <p className="text-sm text-ink-3">
        {greeting()}, {account.user.name.split(" ")[0]}
        <span className="ml-2 rounded-full border border-mint/40 bg-mint/10 px-2 py-0.5 text-[11px] font-medium text-mint">
          Real account
        </span>
      </p>
      <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight">Overview</h1>

      {real.accountType && (
        <Link
          href="/pricing#account-types"
          className="panel mt-6 flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:border-mint/30"
        >
          <div className="flex items-center gap-2.5 text-sm">
            <span className="rounded-full border border-mint/30 bg-mint/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-mint">
              {real.accountType.name}
            </span>
            <span className="text-ink-2">1:{real.accountType.maxLeverage}</span>
          </div>
          <span className="text-xs font-medium text-mint">Compare account types →</span>
        </Link>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="panel glow-ring p-6">
          <div className="text-[11px] uppercase tracking-wide text-ink-3">Account value</div>
          <div className="tnum mt-1.5 font-display text-3xl font-semibold text-ink">{fmtMoney(accountValue / 100, 2)}</div>
        </div>
        <div className="panel p-6">
          <div className="text-[11px] uppercase tracking-wide text-ink-3">Available</div>
          <div className="tnum mt-1.5 font-display text-3xl font-semibold text-ink">{fmtMoney(real.realCashCents / 100, 2)}</div>
        </div>
        <div className="panel p-6">
          <div className="text-[11px] uppercase tracking-wide text-ink-3">Open P&L</div>
          <div
            className={cx(
              "tnum mt-1.5 font-display text-3xl font-semibold",
              (real.engine.open?.unrealizedPnlCents ?? 0) >= 0 ? "text-pos" : "text-neg"
            )}
          >
            {(real.engine.open?.unrealizedPnlCents ?? 0) >= 0 ? "+" : "−"}
            {fmtMoney(Math.abs(real.engine.open?.unrealizedPnlCents ?? 0), 2)}
          </div>
        </div>
      </div>

      <h2 className="font-display mt-10 text-xl font-semibold">Real copy allocation</h2>

      {allocTrader && real.allocation ? (
        <div className="panel panel-hover mt-4 p-6">
          <Link href={`/traders/${real.allocation.slug}`} className="flex items-center gap-4">
            <TraderAvatar name={allocTrader.name} />
            <div>
              <div className="font-medium text-ink">{allocTrader.name}</div>
              <div className="text-xs text-ink-3">{allocTrader.strategy}</div>
              <div className="mt-1.5">
                <LiveSignalBadge trader={allocTrader} />
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[11px] uppercase tracking-wide text-ink-3">Allocated</div>
              <div className="tnum mt-0.5 text-xl font-semibold text-ink">{fmtMoney(real.allocation.amountCents / 100, 2)}</div>
            </div>
          </Link>

          <div className="mt-5 rounded-xl border border-line-soft bg-raised/30 p-4">
            <div className="text-[11px] uppercase tracking-wide text-ink-3">Live position</div>
            {real.engine.open ? (
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-2">
                    {real.engine.open.side === "long" ? "Long" : "Short"} {real.engine.open.instrument}
                  </span>
                  <span className={cx("tnum font-semibold", real.engine.open.unrealizedPnlCents >= 0 ? "text-pos" : "text-neg")}>
                    {real.engine.open.unrealizedPnlCents >= 0 ? "+" : "−"}
                    {fmtMoney(Math.abs(real.engine.open.unrealizedPnlCents) / 100, 2)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-ink-3">
                  <span>Size {fmtMoney(real.engine.open.sizeUsdCents / 100, 2)}</span>
                  <span>{timeAgo(real.engine.open.openedAt)}</span>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink-3">Waiting for the next trade…</p>
            )}
            <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
              Illustrative — this simulated P&amp;L is never settled to your real balance.
            </p>
          </div>

          {real.engine.recentlyClosed.length > 0 && (
            <div className="mt-5 border-t border-line-soft pt-4">
              <div className="text-[11px] uppercase tracking-wide text-ink-3">Recently closed (illustrative)</div>
              <div className="mt-2 space-y-1.5">
                {real.engine.recentlyClosed.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-ink-3">
                      {c.side === "long" ? "Long" : "Short"} {c.instrument}
                    </span>
                    <span className={cx("tnum font-medium", c.realizedPnlCents >= 0 ? "text-pos" : "text-neg")}>
                      {c.realizedPnlCents >= 0 ? "+" : "−"}
                      {fmtMoney(Math.abs(c.realizedPnlCents) / 100, 2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link href="/wallet" className="mt-5 block text-sm font-medium text-mint hover:underline">
            Manage allocation on Wallet →
          </Link>
        </div>
      ) : (
        <div className="panel mt-4 p-10 text-center">
          <p className="text-lg text-ink-2">You&apos;re not copying anyone with real funds yet.</p>
          <p className="mt-2 text-sm text-ink-3">Deposit and allocate your real balance from the Wallet.</p>
          <div className="mt-6">
            <ButtonLink href="/wallet">Go to Wallet</ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
