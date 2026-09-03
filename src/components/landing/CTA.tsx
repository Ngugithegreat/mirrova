import Reveal from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { PLATFORM_STATS } from "@/lib/traders";
import { fmtCount } from "@/lib/format";

export default function CTA() {
  return (
    <section className="border-t border-line bg-surface/60">
      <div className="mx-auto max-w-3xl px-5 py-24 text-center lg:py-32">
        <Reveal>
          <p className="eyebrow">Membership is free</p>
          <h2 className="font-display mt-6 text-4xl font-semibold tracking-tight text-ink sm:text-[3.4rem] sm:leading-[1.05]">
            The market&rsquo;s best minds, one allocation away
          </h2>
          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-ink-2">
            Join {fmtCount(PLATFORM_STATS.copiers)} investors who stopped guessing and started
            allocating. Free to join, copy from $100, leave whenever you wish.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
            <ButtonLink href="/signup" size="lg">
              Create your account
            </ButtonLink>
            <ButtonLink href="/traders" variant="secondary" size="lg">
              Study the register first
            </ButtonLink>
          </div>
          <p className="mt-8 text-xs text-ink-3">Capital at risk. No card required to browse.</p>
        </Reveal>
      </div>
    </section>
  );
}
