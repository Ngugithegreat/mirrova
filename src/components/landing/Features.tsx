import Reveal from "@/components/ui/Reveal";

const FEATURES = [
  {
    title: "Real-time mirroring",
    body: "Trades replicate to your account in a median of 38ms, proportional to your allocation. You get the same entry the trader gets — not a delayed echo.",
    icon: <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />,
  },
  {
    title: "Risk Shield",
    body: "Set a copy stop-loss on every relationship. If your copied position falls to your threshold, Mirrova closes everything and returns you to cash — automatically, even while you sleep.",
    icon: <path d="M12 2 4 5.5v5.7c0 4.9 3.4 9.5 8 10.8 4.6-1.3 8-5.9 8-10.8V5.5L12 2Zm-3.3 9.7 2.3 2.3 4.3-4.5" />,
  },
  {
    title: "Radically transparent records",
    body: "Every trader's full monthly history, max drawdown, win rate and open positions are public — including the months they'd rather you didn't see. We don't allow hidden or reset track records.",
    icon: <path d="M3 3v18h18M8 15v3m4-8v8m4-12v12" />,
  },
  {
    title: "Fractional copying from $100",
    body: "If a trader buys $50,000 of an asset with 5% of their portfolio, your $1,000 copy allocates $50. Same strategy, scaled precisely to your size — including fractional units.",
    icon: <path d="M12 3v18M5.5 7.5h9a3 3 0 0 1 0 6h-5a3 3 0 0 0 0 6h9" />,
  },
  {
    title: "Instant exit, no lock-in",
    body: "Pause copying, close individual positions, or liquidate a whole relationship in one tap. No notice periods, no exit penalties, no questions.",
    icon: <path d="M9 5H5v14h4M15 5h4v14h-4M5 12h14" />,
  },
  {
    title: "Nothing pooled, ever",
    body: "Your funds stay in your own segregated account. Traders never touch your money — they can't deposit, withdraw or even see it. Copying is a data relationship, not a transfer.",
    icon: <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 10a7 7 0 0 1 14 0M17 8l5 5m0-5-5 5" />,
  },
];

export default function Features() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mint">Why Mirrova</p>
        <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-[2.6rem] sm:leading-[1.15]">
          Built like an institution.
          <br className="hidden sm:block" /> Simple like an app.
        </h2>
      </Reveal>

      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 90}>
            <div className="panel panel-hover h-full p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-mint/25 bg-mint/8 text-mint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5.5 w-5.5" strokeLinecap="round" strokeLinejoin="round">
                  {f.icon}
                </svg>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-ink">{f.title}</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-ink-2">{f.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
