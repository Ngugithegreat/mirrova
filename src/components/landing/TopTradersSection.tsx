import { TOP_TRADERS } from "@/lib/traders";
import TraderCard from "@/components/ui/TraderCard";
import Reveal from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";

export default function TopTradersSection() {
  return (
    <section className="relative border-y border-line-soft bg-surface/40">
      <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
        <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mint">The leaderboard</p>
            <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-[2.6rem] sm:leading-[1.15]">
              Meet the most-copied traders
            </h2>
            <p className="mt-5 text-lg text-ink-2">
              Real strategies, full history, nothing cherry-picked. Every profile shows the drawdowns
              alongside the gains.
            </p>
          </div>
          <ButtonLink href="/traders" variant="secondary" className="shrink-0">
            View all strategies →
          </ButtonLink>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
