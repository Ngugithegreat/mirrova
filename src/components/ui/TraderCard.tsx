import Link from "next/link";
import { Trader, traderStats, equitySeries } from "@/lib/traders";
import { fmtPct, fmtCount, fmtCompact } from "@/lib/format";
import TraderAvatar from "./TraderAvatar";
import RiskMeter from "./RiskMeter";
import Sparkline from "@/components/charts/Sparkline";

export default function TraderCard({ trader }: { trader: Trader }) {
  const stats = traderStats(trader);
  const eq = equitySeries(trader);
  const spark = eq.filter((_, i) => i % 2 === 0).slice(-40);

  return (
    <Link
      href={`/traders/${trader.slug}`}
      className="panel panel-hover group block p-6"
      aria-label={`View ${trader.name}'s strategy`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <TraderAvatar name={trader.name} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-[1.05rem] font-semibold leading-tight text-ink">
                {trader.name}
              </span>
              {trader.verified && (
                <svg viewBox="0 0 20 20" className="h-4 w-4 text-mint" fill="currentColor" aria-label="Verified">
                  <path
                    fillRule="evenodd"
                    d="M16.4 3.9a1 1 0 0 1 .2 1.4l-7 9a1 1 0 0 1-1.5.1l-4-4a1 1 0 1 1 1.4-1.4l3.2 3.2 6.3-8.1a1 1 0 0 1 1.4-.2Z"
                  />
                </svg>
              )}
            </div>
            <div className="mt-1 text-xs text-ink-3">
              {trader.flag} {trader.country} · {trader.strategy}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4 border-t border-line-soft pt-4">
        <div>
          <div className="eyebrow-muted">12-month return</div>
          <div className={`fig mt-1 text-[2rem] font-semibold leading-none ${stats.return12m >= 0 ? "text-pos" : "text-neg"}`}>
            {fmtPct(stats.return12m)}
          </div>
        </div>
        <Sparkline data={spark} id={trader.slug} width={116} height={42} positive={stats.return12m >= 0} />
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line-soft pt-4">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.14em] text-ink-3">Copiers</dt>
          <dd className="tnum mt-0.5 text-sm font-semibold text-ink">{fmtCount(trader.copiers)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.14em] text-ink-3">Under copy</dt>
          <dd className="tnum mt-0.5 text-sm font-semibold text-ink">{fmtCompact(trader.aum)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.14em] text-ink-3">Max drawdown</dt>
          <dd className="tnum mt-0.5 text-sm font-semibold text-ink">{stats.maxDrawdown.toFixed(1)}%</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-line-soft pt-4">
        <RiskMeter score={trader.riskScore} />
        <span className="text-[13px] font-medium text-mint underline-offset-4 group-hover:underline">
          View strategy →
        </span>
      </div>
    </Link>
  );
}
