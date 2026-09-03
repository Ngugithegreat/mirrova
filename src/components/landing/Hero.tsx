import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import TraderAvatar from "@/components/ui/TraderAvatar";
import Sparkline from "@/components/charts/Sparkline";
import { TOP_TRADERS, PLATFORM_STATS, equitySeries, traderStats, getTrader } from "@/lib/traders";
import { fmtPct, fmtCount, fmtCompact } from "@/lib/format";

function HeroChart({ data }: { data: number[] }) {
  const W = 460;
  const H = 190;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = 8 + (1 - (v - min) / span) * (H - 16);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = pts.join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden="true">
      <defs>
        <linearGradient id="hero-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-mint)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-mint)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="var(--color-line-soft)" strokeWidth="1" />
      ))}
      <path d={`${path} L${W},${H} L0,${H} Z`} fill="url(#hero-fill)" />
      <path d={path} fill="none" stroke="var(--color-mint)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Hero() {
  const lead = getTrader("isabella-rossi")!;
  const leadStats = traderStats(lead);
  const leadEq = equitySeries(lead).filter((_, i) => i % 2 === 0);
  const chips = [getTrader("daniel-kim")!, getTrader("elena-vasquez")!];
  const proof = TOP_TRADERS.slice(0, 4);

  return (
    <section className="relative overflow-hidden pt-[72px]">
      <div className="hero-grid absolute inset-0" aria-hidden="true" />
      <div
        className="absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(60,227,167,0.35), rgba(14,165,233,0.12), transparent)" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-28 lg:pt-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-mint/25 bg-mint/8 px-4 py-1.5 text-[13px] text-mint">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
            </span>
            {fmtCount(PLATFORM_STATS.copiers)} investors are copying right now
          </div>

          <h1 className="font-display mt-6 text-[2.75rem] font-semibold leading-[1.06] tracking-tight sm:text-6xl lg:text-[4.25rem]">
            Trade like the top&nbsp;1%.
            <br />
            <span className="text-gradient">Automatically.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
            Mirrova connects your portfolio to the strategies of rigorously vetted traders. Every trade
            they make is mirrored to your account in real time, proportional to your investment — with
            risk controls you set and can change at any moment.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <ButtonLink href="/signup" size="lg">
              Start copying free
              <svg viewBox="0 0 20 20" className="h-4.5 w-4.5" fill="currentColor" aria-hidden="true">
                <path d="M11 4l6 6-6 6-1.4-1.4L13.2 11H3V9h10.2L9.6 5.4 11 4z" />
              </svg>
            </ButtonLink>
            <ButtonLink href="/traders" variant="secondary" size="lg">
              Browse top traders
            </ButtonLink>
          </div>

          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-2.5">
              {proof.map((t) => (
                <TraderAvatar key={t.slug} name={t.name} size="sm" className="ring-4 ring-bg" />
              ))}
            </div>
            <p className="text-sm text-ink-2">
              <span className="tnum font-semibold text-ink">{fmtCompact(PLATFORM_STATS.aum)}</span> copied across{" "}
              <span className="tnum font-semibold text-ink">{PLATFORM_STATS.traders}</span> vetted strategies
            </p>
          </div>

          <p className="mt-8 max-w-xl text-xs leading-relaxed text-ink-3">
            Capital at risk. Copy trading does not guarantee returns and past performance is not a reliable
            indicator of future results.
          </p>
        </div>

        {/* Right: product panel */}
        <div className="relative">
          <div className="panel glow-ring relative z-10 p-6">
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
                <div className="tnum text-xl font-semibold text-pos">{fmtPct(leadStats.return12m)}</div>
              </div>
            </div>

            <div className="mt-5">
              <HeroChart data={leadEq} />
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
              className="mt-5 block rounded-xl bg-mint py-3 text-center text-sm font-semibold text-[#052e1f] transition-colors hover:bg-[#54ebb6]"
            >
              Copy {lead.name.split(" ")[0]}
            </Link>
          </div>

          {/* floating chips */}
          {chips.map((t, i) => {
            const s = traderStats(t);
            const eq = equitySeries(t).filter((_, j) => j % 3 === 0).slice(-28);
            return (
              <div
                key={t.slug}
                className={`panel float-slow absolute z-20 hidden items-center gap-3 p-3.5 pr-5 shadow-2xl backdrop-blur-md xl:flex ${
                  i === 0 ? "-left-20 -top-9" : "-bottom-10 -right-8"
                }`}
                style={{ animationDelay: `${i * 1.8}s`, background: "rgba(17,26,46,0.9)" }}
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
