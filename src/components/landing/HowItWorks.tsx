import Reveal from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";

const STEPS = [
  {
    n: "01",
    title: "Discover vetted traders",
    body:
      "Every strategist on Mirrova passes a multi-stage review: a minimum 12-month verified track record, drawdown discipline, and a documented strategy. Fewer than 2% of applicants make it onto the leaderboard.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
  },
  {
    n: "02",
    title: "Copy with one click",
    body:
      "Choose how much to allocate — from $100. From that moment, every position the trader opens or closes is mirrored to your account proportionally, in a median of 38 milliseconds.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="12" height="12" rx="2.5" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    ),
  },
  {
    n: "03",
    title: "Stay in control",
    body:
      "Set a copy stop-loss, cap position sizes, pause mirroring, or exit entirely — at any time, instantly. Your money never leaves your account and is never pooled with anyone else's.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 4 5.5v5.7c0 4.9 3.4 9.5 8 10.8 4.6-1.3 8-5.9 8-10.8V5.5L12 2Z" />
        <path d="m8.7 11.7 2.3 2.3 4.3-4.5" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32" id="how">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mint">How it works</p>
        <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-[2.6rem] sm:leading-[1.15]">
          From zero to copying in under five minutes
        </h2>
        <p className="mt-5 text-lg text-ink-2">
          No trading experience required. You pick the people; the platform handles the execution.
        </p>
      </Reveal>

      <div className="mt-16 grid gap-6 lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 110}>
            <div className="panel relative h-full overflow-hidden p-8">
              <span className="font-display pointer-events-none absolute -right-2 -top-6 text-[7rem] font-bold leading-none text-ink/4 select-none">
                {s.n}
              </span>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-mint/25 bg-mint/8 text-mint">
                {s.icon}
              </div>
              <h3 className="font-display mt-6 text-xl font-semibold text-ink">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-ink-2">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-12 text-center">
        <ButtonLink href="/how-it-works" variant="secondary">
          See the full mechanics →
        </ButtonLink>
      </Reveal>
    </section>
  );
}
