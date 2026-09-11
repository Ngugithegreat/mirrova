import { TOP_TRADERS } from "@/lib/traders";
import TraderCard from "@/components/ui/TraderCard";
import Reveal from "@/components/ui/Reveal";
import TradersLink from "@/components/ui/TradersLink";

export default function TopTradersSection() {
  return (
    <section className="border-y border-line bg-surface/60">
      <div className="mx-auto max-w-[1200px] px-5 py-20 lg:px-8 lg:py-28">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="eyebrow">The register</p>
            <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-[2.75rem] sm:leading-[1.1]">
              The most-copied strategists
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-2">
              Complete histories, nothing cherry-picked. Every profile shows the drawdowns beside the
              gains — that is the point.
            </p>
          </div>
          <TradersLink variant="secondary" size="md" className="shrink-0">
            View all 36 strategies
          </TradersLink>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {TOP_TRADERS.map((t, i) => (
            <Reveal key={t.slug} delay={(i % 3) * 90}>
              <TraderCard trader={t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
