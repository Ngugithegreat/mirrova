import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import TraderAvatar from "@/components/ui/TraderAvatar";
import Sparkline from "@/components/charts/Sparkline";
import LiveChart from "@/components/motion/LiveChart";
import ProsperityField from "@/components/motion/ProsperityField";
import ActivityFeed from "@/components/motion/ActivityFeed";
import CountUp from "@/components/motion/CountUp";
import { PLATFORM_STATS, equitySeries, traderStats, getTrader } from "@/lib/traders";
import { fmtPct, fmtCount } from "@/lib/format";

export default function Hero() {
  const lead = getTrader("isabella-rossi")!;
  const leadStats = traderStats(lead);
  const leadEq = equitySeries(lead).filter((_, i) => i % 2 === 0).slice(-48);
  const chips = [getTrader("daniel-kim")!, getTrader("elena-vasquez")!];

  return (
    <section className="relative overflow-hidden pt-[72px]">
      {/* animated backdrop */}
      <div className="hero-grid absolute inset-0" aria-hidden="true" />
      <div aria-hidden="true">
        <div className="aurora aurora-1 -top-32 left-[8%] h-[420px] w-[420px]" />
        <div className="aurora aurora-2 top-24 right-[4%] h-[380px] w-[480px]" />
        <div className="aurora aurora-3 top-[420px] left-[38%] h-[300px] w-[300px]" />
      </div>
      <ProsperityField particleCount={32} />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 pb-20 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-28 lg:pt-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-mint/25 bg-mint/8 px-4 py-1.5 text-[13px] text-mint backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
            </span>
            {fmtCount(PLATFORM_STATS.copiers)} investors copying live
          </div>

          <h1 className="font-display mt-6 text-[2.75rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.3rem]">
            Trade like the top&nbsp;1%.
            <br />
            <span className="text-aurora">Automatically.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
            Mirrova mirrors the strategies of rigorously vetted traders into your account in real time —
            proportional to your investment, with risk controls you set and can change at any moment.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <ButtonLink href="/signup" size="lg">
              Start copying free
            </ButtonLink>
            <ButtonLink href="/traders" variant="secondary" size="lg">
              Browse top traders
            </ButtonLink>
          </div>

          <dl className="mt-12 grid max-w-xl grid-cols-3 gap-6 border-t border-line pt-6">
            <div>
              <dd className="fig text-[1.7rem] font-semibold text-ink">
                <CountUp value={PLATFORM_STATS.aum} format="money-compact" />
              </dd>
              <dt className="mt-1 text-xs text-ink-3">under copy</dt>
            </div>
            <div>
              <dd className="fig text-[1.7rem] font-semibold text-ink">
                <CountUp value={PLATFORM_STATS.copiers} format="count" />
              </dd>
              <dt className="mt-1 text-xs text-ink-3">active copiers</dt>
            </div>
            <div>
              <dd className="fig text-[1.7rem] font-semibold text-ink">
                <CountUp value={PLATFORM_STATS.traders} format="plain" />
              </dd>
              <dt className="mt-1 text-xs text-ink-3">vetted strategies</dt>
            </div>
          </dl>

          <p className="mt-8 max-w-xl text-xs leading-relaxed text-ink-3">
            Capital at risk. Copy trading does not guarantee returns and past performance is not a
            reliable indicator of future results.
          </p>
        </div>

        {/* live product panel */}
        <div className="relative">
          <div className="panel glow-ring relative z-10 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TraderAvatar name={lead.name} />
                <div>
                  <div className="flex items-center gap-1.5 font-medium text-ink">
                    {lead.name}
                    <svg viewBox="0 0 20 20" className="h-4 w-4 text-mint" fill="currentColor" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M16.4 3.9a1 1 0 0 1 .2 1.4l-7 9a1 1 0 0 1-1.5.1l-4-4a1 1 0 1 1 1.4-1.4l3.2 3.2 6.3-8.1a1 1 0 0 1 1.4-.2Z"
                      />
                    </svg>
                  </div>
                  <div className="text-xs text-ink-3">{lead.strategy}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wide text-ink-3">12m return</div>
                <div className="fig text-xl font-semibold text-pos">{fmtPct(leadStats.return12m)}</div>
              </div>
            </div>

            <div className="mt-5">
              <LiveChart initial={leadEq} />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line-soft pt-4 text-center">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-ink-3">Copiers</div>
                <div className="tnum mt-0.5 font-semibold text-ink">{fmtCount(lead.copiers)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-ink-3">Max drawdown</div>
                <div className="tnum mt-0.5 font-semibold text-ink">{leadStats.maxDrawdown.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-ink-3">Win rate</div>
                <div className="tnum mt-0.5 font-semibold text-ink">{lead.winRate}%</div>
              </div>
            </div>

            <Link
              href={`/traders/${lead.slug}`}
              className="sheen relative mt-5 block overflow-hidden rounded-full bg-gradient-to-r from-violet via-mint to-fuchsia py-3 text-center text-sm font-semibold text-[#06060c]"
            >
              Copy {lead.name.split(" ")[0]}
            </Link>

            <div className="mt-5 border-t border-line-soft pt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-3">
                  Live activity
                </span>
                <span className="text-[10px] text-ink-3">simulated preview</span>
              </div>
              <ActivityFeed />
            </div>
          </div>

          {/* floating chips */}
          {chips.map((t, i) => {
            const s = traderStats(t);
            const eq = equitySeries(t).filter((_, j) => j % 3 === 0).slice(-28);
            return (
              <div
                key={t.slug}
                className={`panel absolute z-20 hidden items-center gap-3 p-3.5 pr-5 shadow-2xl backdrop-blur-md xl:flex ${
                  i === 0 ? "float-a -left-20 -top-9" : "float-b -bottom-10 -right-8"
                }`}
                style={{ background: "rgba(20,20,37,0.88)" }}
              >
                <TraderAvatar name={t.name} size="sm" />
                <div>
                  <div className="text-xs font-medium text-ink">{t.name}</div>
                  <div className={`tnum text-xs ${s.return12m >= 0 ? "text-pos" : "text-neg"}`}>
                    {fmtPct(s.return12m)} · 12m
                  </div>
                </div>
                <Sparkline data={eq} id={`chip-${t.slug}`} width={72} height={30} positive={s.return12m >= 0} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
