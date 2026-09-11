import Reveal from "@/components/ui/Reveal";
import TraderAvatar from "@/components/ui/TraderAvatar";

const LEAD_QUOTE = {
  quote:
    "Every platform shows you the winners. Asport Traders shows you the drawdowns, the losing months, the risk score — and that is exactly why I trust it with real money. I believe what I can verify.",
  name: "Samuel K.",
  role: "Copying five strategists · member since 2022",
};

const QUOTES = [
  {
    quote:
      "I spent two years losing money trading on my own. Now I split my capital across three conservative strategists and finally sleep at night. The copy stop-loss is the feature that sold me.",
    name: "Rebecca A.",
    role: "Copying 3 traders · joined 2023",
  },
  {
    quote:
      "As a strategist, the vetting was genuinely hard — they audited a year of my statements before listing me. That's why copiers here commit real capital.",
    name: "Chloé Martin",
    role: "Pro Trader on Asport Traders",
  },
];

export default function Testimonials() {
  return (
    <section className="border-y border-line bg-surface/60">
      <div className="mx-auto max-w-[1200px] px-5 py-20 lg:px-8 lg:py-28">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">In their words</p>
          <blockquote className="font-display mt-8 text-[1.6rem] font-medium leading-[1.4] tracking-tight text-ink sm:text-[2rem]">
            &ldquo;{LEAD_QUOTE.quote}&rdquo;
          </blockquote>
          <figcaption className="mt-8 flex items-center justify-center gap-3">
            <TraderAvatar name={LEAD_QUOTE.name} size="sm" />
            <div className="text-left">
              <div className="text-sm font-semibold text-ink">{LEAD_QUOTE.name}</div>
              <div className="text-xs text-ink-3">{LEAD_QUOTE.role}</div>
            </div>
          </figcaption>
        </Reveal>

        <div className="mx-auto mt-16 grid max-w-4xl gap-x-14 gap-y-10 md:grid-cols-2">
          {QUOTES.map((q, i) => (
            <Reveal key={q.name} delay={i * 100}>
              <figure className="rule pt-6">
                <blockquote className="leading-relaxed text-ink-2">&ldquo;{q.quote}&rdquo;</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <TraderAvatar name={q.name} size="sm" />
                  <div>
                    <div className="text-sm font-semibold text-ink">{q.name}</div>
                    <div className="text-xs text-ink-3">{q.role}</div>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <p className="mt-12 text-center text-xs text-ink-3">Illustrative testimonials. Experiences vary; capital at risk.</p>
      </div>
    </section>
  );
}
