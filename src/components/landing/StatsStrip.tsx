import { PLATFORM_STATS } from "@/lib/traders";
import { fmtCompact, fmtCount } from "@/lib/format";
import Reveal from "@/components/ui/Reveal";

export default function StatsStrip() {
  const stats = [
    { label: "Assets under copy", value: fmtCompact(PLATFORM_STATS.aum) },
    { label: "Active copiers", value: fmtCount(PLATFORM_STATS.copiers) },
    { label: "Vetted strategies", value: String(PLATFORM_STATS.traders) },
    { label: "Countries served", value: `${PLATFORM_STATS.countries}+` },
    { label: "Median mirror speed", value: `${PLATFORM_STATS.executionMs}ms` },
  ];
  return (
    <section className="border-b border-line-soft">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-5 py-14 sm:grid-cols-3 lg:grid-cols-5 lg:px-8">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 70} className="text-center">
            <div className="tnum font-display text-3xl font-semibold text-ink lg:text-4xl">{s.value}</div>
            <div className="mt-2 text-sm text-ink-3">{s.label}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
