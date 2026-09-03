import Link from "next/link";
import { TRADERS, traderStats } from "@/lib/traders";
import { fmtPct } from "@/lib/format";
import TraderAvatar from "@/components/ui/TraderAvatar";

/** Infinite marquee of the whole register — pauses on hover, each chip links to the profile. */
export default function TraderMarquee() {
  const roster = TRADERS.slice(0, 18).map((t) => ({ t, s: traderStats(t) }));
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center gap-4 pr-4" aria-hidden={key === "b"}>
      {roster.map(({ t, s }) => (
        <Link
          key={`${key}-${t.slug}`}
          href={`/traders/${t.slug}`}
          tabIndex={key === "b" ? -1 : undefined}
          className="panel panel-hover flex shrink-0 items-center gap-3 px-4 py-3"
        >
          <TraderAvatar name={t.name} size="sm" />
          <div>
            <div className="text-xs font-medium text-ink">{t.name}</div>
            <div className="text-[10px] text-ink-3">{t.strategy}</div>
          </div>
          <span className={`tnum ml-2 text-xs font-semibold ${s.return12m >= 0 ? "text-pos" : "text-neg"}`}>
            {fmtPct(s.return12m)}
          </span>
        </Link>
      ))}
    </div>
  );
  return (
    <section className="relative overflow-hidden border-b border-line-soft py-10">
      <div className="marquee-slow flex w-max">{[row("a"), row("b")]}</div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-bg to-transparent" />
    </section>
  );
}
