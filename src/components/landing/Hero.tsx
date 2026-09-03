import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import TraderAvatar from "@/components/ui/TraderAvatar";
import { PLATFORM_STATS, equitySeries, traderStats, getTrader } from "@/lib/traders";
import { fmtPct, fmtCount, fmtCompact } from "@/lib/format";

function PlateChart({ data }: { data: number[] }) {
  const W = 440;
  const H = 170;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = 6 + (1 - (v - min) / span) * (H - 12);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = pts.join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden="true">
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="var(--color-line-soft)" strokeWidth="1" />
      ))}
      <line x1="0" x2={W} y1={H - 1} y2={H - 1} stroke="var(--color-line)" strokeWidth="1" />
      <path d={`${path} L${W},${H} L0,${H} Z`} fill="rgba(29,92,60,0.07)" />
      <path d={path} fill="none" stroke="var(--color-mint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Hero() {
  const lead = getTrader("isabella-rossi")!;
  const leadStats = traderStats(lead);
  const leadEq = equitySeries(lead).filter((_, i) => i % 2 === 0);

  return (
    <section className="pt-[76px]">
      <div className="mx-auto grid max-w-[1200px] items-center gap-14 px-5 pb-16 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:px-8 lg:pb-24 lg:pt-20">
        <div>
          <p className="eyebrow">Copy trading, considered</p>

          <h1 className="font-display mt-6 text-[3rem] font-semibold leading-[1.02] tracking-tight text-ink sm:text-[4rem] lg:text-[4.6rem]">
            Own the judgment of the market&rsquo;s finest.
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-2">
            Mirrova mirrors the strategies of rigorously vetted traders into your own account —
            proportionally, in real time, with published drawdowns and risk controls that answer to you,
            not to them.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-5">
            <ButtonLink href="/signup" size="lg">
              Begin copying
            </ButtonLink>
            <Link
              href="/traders"
              className="text-[15px] font-medium text-ink underline decoration-ink/30 underline-offset-[6px] transition-colors hover:decoration-mint"
            >
              Study the traders first →
            </Link>
          </div>

          <dl className="rule mt-12 grid max-w-xl grid-cols-3 gap-6 pt-6">
            <div>
              <dd className="fig text-2xl font-semibold text-ink">{fmtCompact(PLATFORM_STATS.aum)}</dd>
              <dt className="mt-1 text-xs text-ink-3">under copy</dt>
            </div>
            <div>
              <dd className="fig text-2xl font-semibold text-ink">{fmtCount(PLATFORM_STATS.copiers)}</dd>
              <dt className="mt-1 text-xs text-ink-3">active copiers</dt>
            </div>
            <div>
              <dd className="fig text-2xl font-semibold text-ink">&lt;2%</dd>
              <dt className="mt-1 text-xs text-ink-3">of applicants listed</dt>
            </div>
          </dl>

          <p className="mt-8 max-w-xl text-xs leading-relaxed text-ink-3">
            Capital at risk. Copy trading does not guarantee returns; past performance is not a reliable
            indicator of future results.
          </p>
        </div>

        {/* Prospectus plate */}
        <div className="panel glow-ring p-7">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <span className="eyebrow-muted">Strategist of the quarter</span>
            <span className="eyebrow-muted tnum">No. 01 / {PLATFORM_STATS.traders}</span>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <TraderAvatar name={lead.name} size="lg" />
              <div>
                <div className="font-display text-xl font-semibold leading-tight text-ink">{lead.name}</div>
                <div className="mt-1 text-xs text-ink-3">
                  {lead.flag} {lead.country} · {lead.strategy}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="eyebrow-muted">12-mo return</div>
              <div className="fig mt-1 text-[2.1rem] font-semibold leading-none text-pos">
                {fmtPct(leadStats.return12m)}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <PlateChart data={leadEq} />
            <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-[0.14em] text-ink-3">
              <span>Sep 2024</span>
              <span>Growth of $100 · net of fees</span>
              <span>Aug 2026</span>
            </div>
          </div>

          <dl className="rule mt-6 grid grid-cols-3 gap-4 pt-5">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-ink-3">Copiers</dt>
              <dd className="tnum mt-1 text-base font-semibold text-ink">{fmtCount(lead.copiers)}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-ink-3">Max drawdown</dt>
              <dd className="tnum mt-1 text-base font-semibold text-ink">{leadStats.maxDrawdown.toFixed(1)}%</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-ink-3">Win rate</dt>
              <dd className="tnum mt-1 text-base font-semibold text-ink">{lead.winRate}%</dd>
            </div>
          </dl>

          <ButtonLink href={`/traders/${lead.slug}`} className="mt-6 w-full">
            Review {lead.name.split(" ")[0]}&rsquo;s full record
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
