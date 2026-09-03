import Reveal from "@/components/ui/Reveal";

const FEATURES = [
  {
    n: "i.",
    title: "Real-time mirroring",
    body: "Trades replicate to your account in a median of 38ms, proportional to your allocation — the same entry the strategist gets, not a delayed echo.",
  },
  {
    n: "ii.",
    title: "The copy stop-loss",
    body: "Set a maximum loss on every relationship. If a copy falls to your threshold, every mirrored position is closed and you return to cash — automatically, even while you sleep.",
  },
  {
    n: "iii.",
    title: "Unresettable records",
    body: "Full monthly history, maximum drawdown, win rate and open positions are public for every strategist — including the months they'd rather you didn't see.",
  },
  {
    n: "iv.",
    title: "Fractional precision",
    body: "If a strategist puts 5% of their book into an asset, 5% of your allocation follows — from $100, using fractional units, scaled exactly.",
  },
  {
    n: "v.",
    title: "Exit without ceremony",
    body: "Pause, trim, or liquidate a relationship at market price, any hour of any day. No notice periods, no exit fees, no questions.",
  },
  {
    n: "vi.",
    title: "Nothing pooled, ever",
    body: "Your funds stay in your own segregated account. Strategists cannot see, touch, or transact against your money — copying is a data relationship, not a transfer.",
  },
];

export default function Features() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-20 lg:px-8 lg:py-28">
      <Reveal className="max-w-2xl">
        <p className="eyebrow">The standard</p>
        <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-[2.75rem] sm:leading-[1.1]">
          Built to institutional discipline, worn lightly
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-x-14 md:grid-cols-2">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={(i % 2) * 90}>
            <div className="rule flex gap-6 py-7">
              <span className="fig w-8 shrink-0 pt-0.5 text-lg font-semibold italic text-mint">{f.n}</span>
              <div>
                <h3 className="font-display text-xl font-semibold text-ink">{f.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-2">{f.body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
