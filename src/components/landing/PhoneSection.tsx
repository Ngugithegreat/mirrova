import Reveal from "@/components/ui/Reveal";
import PhoneDemo from "@/components/motion/PhoneDemo";
import { ButtonLink } from "@/components/ui/Button";

const POINTS = [
  {
    title: "One tap, fully mirrored",
    body: "Pick a strategist, set your amount and stop-loss, and every trade they make lands in your account in a median of 38ms.",
  },
  {
    title: "Protection is on-screen, always",
    body: "Your protected floor and stop-loss travel with every copy — not buried in settings, but visible on the position itself.",
  },
  {
    title: "Exit is one gesture away",
    body: "Pause, trim, or liquidate at market from anywhere. No notice periods, no lock-ins, no calls to make.",
  },
];

export default function PhoneSection() {
  return (
    <section className="relative overflow-hidden border-y border-line-soft bg-surface/40">
      <div aria-hidden="true">
        <div className="aurora aurora-2 -top-24 left-[10%] h-[360px] w-[420px] !opacity-30" />
        <div className="aurora aurora-1 bottom-0 right-[6%] h-[320px] w-[360px] !opacity-25" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
        <Reveal className="order-2 lg:order-1">
          <PhoneDemo />
        </Reveal>

        <div className="order-1 lg:order-2">
          <Reveal>
            <p className="eyebrow">The experience</p>
            <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-[2.75rem] sm:leading-[1.1]">
              Watch a copy come to life
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-2">
              From discovering a strategist to a protected, growing position — the entire journey takes
              under a minute. The demo on the left plays it end to end.
            </p>
          </Reveal>

          <div className="mt-10 space-y-7">
            {POINTS.map((p, i) => (
              <Reveal key={p.title} delay={i * 110}>
                <div className="flex gap-4">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-mint/30 bg-mint/10">
                    <span className="fig text-xs font-semibold text-mint">{i + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink">{p.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-ink-2">{p.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={330} className="mt-10">
            <ButtonLink href="/signup" size="lg">
              Try it with a practice account
            </ButtonLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
