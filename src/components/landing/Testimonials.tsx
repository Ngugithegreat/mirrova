import Reveal from "@/components/ui/Reveal";
import TraderAvatar from "@/components/ui/TraderAvatar";

const QUOTES = [
  {
    quote:
      "I spent two years losing money trying to trade on my own. On Mirrova I split my capital across three conservative strategists and finally sleep at night. The copy stop-loss is the feature that sold me.",
    name: "Rebecca A.",
    role: "Copying 3 traders · joined 2023",
  },
  {
    quote:
      "The transparency is the difference. Every platform shows you winners; Mirrova shows you the drawdowns, the losing months, the risk score. I trust what I can verify.",
    name: "Samuel K.",
    role: "Copying 5 traders · joined 2022",
  },
  {
    quote:
      "As a strategist, the vetting was genuinely hard — they audited a year of my statements before listing me. That's exactly why copiers here commit real capital.",
    name: "Chloé Martin",
    role: "Pro Trader on Mirrova",
    trader: true,
  },
];

export default function Testimonials() {
  return (
    <section className="border-y border-line-soft bg-surface/40">
      <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mint">Voices</p>
          <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-[2.6rem] sm:leading-[1.15]">
            Trusted by copiers and the traders they follow
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {QUOTES.map((q, i) => (
            <Reveal key={q.name} delay={i * 100}>
              <figure className="panel flex h-full flex-col p-8">
                <svg viewBox="0 0 24 24" className="h-7 w-7 text-mint/60" fill="currentColor" aria-hidden="true">
                  <path d="M4 12c0-4 2.5-7 6.5-8l.7 1.7C8.6 6.8 7.3 8.4 7 10c.3-.1.7-.2 1.2-.2 2 0 3.4 1.5 3.4 3.5S10 17 7.8 17C5.5 17 4 15.2 4 12Zm9.5 0c0-4 2.5-7 6.5-8l.7 1.7c-2.6 1.1-3.9 2.7-4.2 4.3.3-.1.7-.2 1.2-.2 2 0 3.4 1.5 3.4 3.5s-1.6 3.7-3.8 3.7c-2.3 0-3.8-1.8-3.8-5Z" />
                </svg>
                <blockquote className="mt-4 flex-1 leading-relaxed text-ink-2">“{q.quote}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-line-soft pt-5">
                  <TraderAvatar name={q.name} size="sm" />
                  <div>
                    <div className="text-sm font-medium text-ink">{q.name}</div>
                    <div className="text-xs text-ink-3">{q.role}</div>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-ink-3">Illustrative testimonials. Experiences vary; capital at risk.</p>
      </div>
    </section>
  );
}
