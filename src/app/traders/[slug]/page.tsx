import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import TraderAvatar from "@/components/ui/TraderAvatar";
import RiskMeter from "@/components/ui/RiskMeter";
import EquityChart from "@/components/charts/EquityChart";
import MonthlyHeatmap from "@/components/charts/MonthlyHeatmap";
import AllocationBars from "@/components/charts/AllocationBars";
import CopyPanel from "@/components/traders/CopyPanel";
import LiveSignalPanel from "@/components/traders/LiveSignalPanel";
import LiveSignalBadge from "@/components/traders/LiveSignalBadge";
import Auroras from "@/components/motion/Auroras";
import TradeNetwork from "@/components/motion/TradeNetwork";
import Reveal from "@/components/ui/Reveal";
import { TRADERS, getTrader, traderStats, equitySeries } from "@/lib/traders";
import { recentTrades } from "@/lib/trades";
import { fmtPct, fmtCount, fmtCompact } from "@/lib/format";

export function generateStaticParams() {
  return TRADERS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = getTrader(slug);
  if (!t) return {};
  return {
    title: `${t.name} — ${t.strategy}`,
    description: `${t.name}'s verified track record on Asport Traders: monthly returns, drawdown, risk score and open strategy. Copy from $${t.minCopy}.`,
  };
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return (
    <div className="panel p-4">
      <div className="text-[11px] uppercase tracking-wide text-ink-3">{label}</div>
      <div className={`tnum mt-1 text-xl font-semibold ${tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}

export default async function TraderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = getTrader(slug);
  if (!t) notFound();
  const s = traderStats(t);
  const eq = equitySeries(t);
  const trades = recentTrades(t);

  return (
    <>
      <Navbar />
      <main className="pt-[72px]">
        <div className="relative overflow-hidden border-b border-line-soft bg-surface/40">
          <Auroras dim />
          <TradeNetwork density={0.55} opacity={0.5} />
          <div className="relative mx-auto max-w-7xl px-5 py-10 lg:px-8">
            <Link href="/traders" className="text-sm text-ink-3 transition-colors hover:text-ink">
              ← All traders
            </Link>
            <div className="mt-6 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div className="flex items-center gap-5">
                <TraderAvatar name={t.name} size="xl" />
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t.name}</h1>
                    {t.verified && (
                      <span className="flex items-center gap-1 rounded-full border border-mint/30 bg-mint/10 px-2.5 py-1 text-xs font-medium text-mint">
                        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.4 3.9a1 1 0 0 1 .2 1.4l-7 9a1 1 0 0 1-1.5.1l-4-4a1 1 0 1 1 1.4-1.4l3.2 3.2 6.3-8.1a1 1 0 0 1 1.4-.2Z" />
                        </svg>
                        Verified Pro
                      </span>
                    )}
                    {t.badges.map((b) => (
                      <span key={b} className="rounded-full border border-line bg-raised/60 px-2.5 py-1 text-xs text-ink-2">
                        {b}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-ink-2">
                    {t.handle} · {t.flag} {t.country} · {t.strategy} · On Asport Traders since {t.joined}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                    <RiskMeter score={t.riskScore} />
                    <LiveSignalBadge trader={t} size="md" />
                  </div>
                </div>
              </div>
              <div className="flex gap-8 lg:text-right">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-3">Copiers</div>
                  <div className="tnum mt-1 text-2xl font-semibold text-ink">{fmtCount(t.copiers)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-3">Under copy</div>
                  <div className="tnum mt-1 text-2xl font-semibold text-ink">{fmtCompact(t.aum)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-3">12m return</div>
                  <div className={`tnum mt-1 text-2xl font-semibold ${s.return12m >= 0 ? "text-pos" : "text-neg"}`}>
                    {fmtPct(s.return12m)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1fr_360px] lg:px-8">
          <div className="min-w-0 space-y-8">
            <section className="panel glow-ring p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Growth of $100 — last 24 months</h2>
                <span className={`tnum text-sm font-semibold ${s.return24m >= 0 ? "text-pos" : "text-neg"}`}>{fmtPct(s.return24m)}</span>
              </div>
              <EquityChart data={eq} />
            </section>

            <section>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="YTD return" value={fmtPct(s.returnYtd)} tone={s.returnYtd >= 0 ? "pos" : "neg"} />
                <Stat label="Max drawdown" value={`${s.maxDrawdown.toFixed(1)}%`} tone="neg" />
                <Stat label="Sharpe ratio" value={s.sharpe.toFixed(2)} />
                <Stat label="Win rate" value={`${t.winRate}%`} />
                <Stat label="Profitable months" value={`${s.profitableMonths}/24`} />
                <Stat label="Best month" value={fmtPct(s.bestMonth)} tone="pos" />
                <Stat label="Worst month" value={fmtPct(s.worstMonth)} tone="neg" />
                <Stat label="Avg. hold time" value={t.avgHoldDays < 1 ? `${Math.round(t.avgHoldDays * 24)}h` : `${t.avgHoldDays}d`} />
              </div>
            </section>

            <Reveal as="section" className="panel p-6">
              <h2 className="font-display mb-4 text-lg font-semibold">Monthly returns</h2>
              <MonthlyHeatmap returns={t.monthlyReturns} />
            </Reveal>

            <Reveal as="section" className="panel p-6">
              <h2 className="font-display mb-4 text-lg font-semibold">Recent closed trades</h2>
              <div className="scroll-x">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-3">
                      <th className="py-3 pr-4 font-medium">Instrument</th>
                      <th className="py-3 pr-4 font-medium">Side</th>
                      <th className="py-3 pr-4 font-medium">Opened</th>
                      <th className="py-3 pr-4 font-medium">Held</th>
                      <th className="py-3 text-right font-medium">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((tr, i) => (
                      <tr key={i} className="border-b border-line-soft last:border-0">
                        <td className="py-3.5 pr-4 font-medium text-ink">{tr.instrument}</td>
                        <td className="py-3.5 pr-4">
                          <span className={`rounded-[2px] px-2 py-0.5 text-xs font-medium ${tr.side === "Long" ? "bg-pos/10 text-pos" : "bg-neg/10 text-neg"}`}>
                            {tr.side}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 text-ink-2">{tr.opened}</td>
                        <td className="tnum py-3.5 pr-4 text-ink-2">{tr.held}</td>
                        <td className={`tnum py-3.5 text-right font-semibold ${tr.pnlPct >= 0 ? "text-pos" : "text-neg"}`}>
                          {fmtPct(tr.pnlPct, { digits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>

            <Reveal as="section" className="panel p-6">
              <h2 className="font-display mb-3 text-lg font-semibold">About this strategy</h2>
              <p className="leading-relaxed text-ink-2">{t.bio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {t.markets.map((m) => (
                  <span key={m} className="rounded-full border border-line bg-raised/60 px-3 py-1 text-xs text-ink-2">
                    {m}
                  </span>
                ))}
                <span className="rounded-full border border-line bg-raised/60 px-3 py-1 text-xs text-ink-2">{t.style} risk</span>
                <span className="tnum rounded-full border border-line bg-raised/60 px-3 py-1 text-xs text-ink-2">
                  {t.trades.toLocaleString()} lifetime trades
                </span>
              </div>
            </Reveal>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <LiveSignalPanel trader={t} />
            <CopyPanel slug={t.slug} name={t.name} perfFee={t.perfFee} minCopy={t.minCopy} />
            <div className="panel p-6">
              <h3 className="font-display text-base font-semibold">Current allocation</h3>
              <div className="mt-4">
                <AllocationBars allocation={t.allocation} />
              </div>
            </div>
          </aside>
        </div>

        <div className="mx-auto max-w-7xl px-5 pb-12 lg:px-8">
          <p className="text-xs leading-relaxed text-ink-3">
            Track record shown is simulated for this platform preview and net of fees. Past performance is
            not a reliable indicator of future results. Copy trading involves risk of loss.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
