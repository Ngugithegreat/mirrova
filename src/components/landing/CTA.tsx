import Reveal from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import ProsperityField from "@/components/motion/ProsperityField";
import BullMascot from "@/components/motion/BullMascot";
import { PLATFORM_STATS } from "@/lib/traders";
import { fmtCount } from "@/lib/format";

export default function CTA() {
  return (
    <section className="relative overflow-hidden border-t border-line bg-surface/60">
      <div aria-hidden="true">
        <div className="aurora aurora-1 -top-20 left-[15%] h-[300px] w-[300px] !opacity-30" />
        <div className="aurora aurora-2 bottom-0 right-[12%] h-[280px] w-[340px] !opacity-25" />
        <span className="ring-pulse absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-mint/25" />
        <span className="ring-pulse absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet/25" style={{ animationDelay: "1.6s" }} />
      </div>
      <ProsperityField dim particleCount={20} />
      <div className="absolute inset-x-0 bottom-0 h-[90px] overflow-hidden" aria-hidden="true">
        <BullMascot id="cta" bottom="2px" scale={0.85} duration={34} delay={12} opacity={0.8} />
      </div>
      <div className="relative mx-auto max-w-3xl px-5 py-24 text-center lg:py-32">
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
