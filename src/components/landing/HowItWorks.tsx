import Reveal from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";

const STEPS = [
  {
    n: "01",
    title: "Study the register",
    body:
      "Every strategist passes a multi-stage review — a verified 12-month record, drawdown discipline, a documented process. Fewer than 2% of applicants are listed, and every history is public and permanent.",
  },
  {
    n: "02",
    title: "Allocate on your terms",
    body:
      "Choose an amount from $100 and set your copy stop-loss before a single trade is mirrored. From then on, every position is replicated proportionally to your allocation — in a median of 38 milliseconds.",
  },
  {
    n: "03",
    title: "Hold the line",
    body:
      "Pause mirroring, close a position, or exit entirely — at any hour, at market, without notice periods. Your money never leaves your own segregated account, and your downside is capped where you set it.",
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-20 lg:px-8 lg:py-28" id="how">
      <Reveal className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">The method</p>
          <h2 className="font-display mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-[2.75rem] sm:leading-[1.1]">
            Three decisions. Everything else is executed for you.
          </h2>
        </div>
        <ButtonLink href="/how-it-works" variant="secondary" className="shrink-0">
          The full mechanics
        </ButtonLink>
      </Reveal>

      <div className="mt-14 grid gap-x-10 gap-y-12 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 110}>
            <div className="rule-heavy pt-6">
              <div className="fig text-sm font-semibold text-mint">{s.n}</div>
              <h3 className="font-display mt-3 text-[1.45rem] font-semibold text-ink">{s.title}</h3>
              <p className="mt-3.5 leading-relaxed text-ink-2">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
