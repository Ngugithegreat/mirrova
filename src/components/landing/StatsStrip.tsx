import Reveal from "@/components/ui/Reveal";
import { PLATFORM_STATS } from "@/lib/traders";
import { fmtCount } from "@/lib/format";

export default function StatsStrip() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-20 lg:grid-cols-[0.42fr_0.58fr] lg:gap-20 lg:px-8 lg:py-28">
        <Reveal>
          <p className="eyebrow">The principle</p>
          <div className="rule-heavy mt-5 w-16" />
        </Reveal>
        <Reveal delay={100}>
          <p className="font-display text-[1.7rem] font-medium leading-[1.35] tracking-tight text-ink sm:text-[2.1rem]">
            Most people shouldn&rsquo;t trade. They should <em className="text-mint">allocate</em> — to
            proven judgment, on published records, with their risk decided in advance. That discipline is
            what {fmtCount(PLATFORM_STATS.copiers)} investors practise here every day.
          </p>
          <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-ink-2">
            Every strategist on Mirrova shows a complete, unresettable history — the drawdowns beside the
            gains. You choose the people; the platform executes with precision and holds the line you set.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
