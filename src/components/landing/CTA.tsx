import Reveal from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { PLATFORM_STATS } from "@/lib/traders";
import { fmtCount } from "@/lib/format";

export default function CTA() {
  return (
    <section className="relative overflow-hidden border-t border-line-soft">
      <div
        className="absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(60,227,167,0.45), rgba(14,165,233,0.15), transparent)" }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-3xl px-5 py-28 text-center lg:py-36">
        <Reveal>
          <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-[3.2rem] sm:leading-[1.1]">
            The market's best minds are one click away
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ink-2">
            Join {fmtCount(PLATFORM_STATS.copiers)} investors who stopped guessing and started copying.
            Free to join, copy from $100, leave whenever you like.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <ButtonLink href="/signup" size="lg">
              Create free account
            </ButtonLink>
            <ButtonLink href="/traders" variant="secondary" size="lg">
              Explore traders first
            </ButtonLink>
          </div>
          <p className="mt-8 text-xs text-ink-3">Capital at risk. No card required to browse.</p>
        </Reveal>
      </div>
    </section>
  );
}
