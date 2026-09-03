import type { Metadata } from "next";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { ButtonLink } from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { fmtMoney } from "@/lib/format";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "The exact mechanics of copy trading on Mirrova: proportional mirroring, execution, risk controls, fees and exits — explained end to end.",
};

const STEPS = [
  {
    title: "Create your account",
    body: "Sign up free — no minimum balance, no card required to browse. Verify your identity, fund whenever you're ready. Your funds sit in a segregated account in your own name.",
  },
  {
    title: "Research the leaderboard",
    body: "Every trader's complete history is public: monthly returns, max drawdown, risk score, win rate, open positions and fees. Filter by risk style and market. Nothing is paywalled and nothing can be hidden or reset by the trader.",
  },
  {
    title: "Allocate and configure",
    body: "Choose an amount from $100 and set your copy stop-loss. Your allocation is earmarked within your account — it is never transferred to the trader or pooled with other copiers.",
  },
  {
    title: "Mirroring begins",
    body: "From that moment, every trade the strategist makes is replicated proportionally in your account — median 38ms after theirs, using fractional units so even small allocations track precisely.",
  },
  {
    title: "Monitor with full transparency",
    body: "Your dashboard shows every mirrored position, live P&L per relationship, and your distance from each stop-loss. You'll be notified of every trade, and traders publish rationales you can read.",
  },
  {
    title: "Adjust or exit — instantly",
    body: "Add to a winner, pause new trades, close one position, or liquidate the whole relationship at market price. 24/7, no notice period, no exit fees.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[72px]">
        <div className="border-b border-line-soft bg-surface/40">
          <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mint">The mechanics</p>
            <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">How copy trading works on Mirrova</h1>
            <p className="mt-4 max-w-2xl text-lg text-ink-2">
              End to end, with the details other platforms gloss over. Five minutes to read; a lifetime of
              not being surprised.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-5 py-16">
          <ol className="relative space-y-10 border-l border-line pl-8">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 60} className="relative">
                <span className="absolute -left-[45px] flex h-8 w-8 items-center justify-center rounded-full border border-mint/40 bg-bg text-sm font-semibold text-mint">
                  {i + 1}
                </span>
                <h2 className="font-display text-xl font-semibold text-ink">{s.title}</h2>
                <p className="mt-2 leading-relaxed text-ink-2">{s.body}</p>
              </Reveal>
            ))}
          </ol>

          <Reveal className="panel mt-16 p-8">
            <h2 className="font-display text-xl font-semibold">The proportionality math, precisely</h2>
            <p className="mt-3 leading-relaxed text-ink-2">
              Say a trader&apos;s portfolio is {fmtMoney(80000)} and they open a {fmtMoney(4000)} position —
              5% of their book. If you copy them with {fmtMoney(1000)}, your account opens the same
              instrument at 5% of your allocation: {fmtMoney(50)}. When they close half, you close half.
              When they exit, you exit. Their percentage moves are your percentage moves — which is why the
              only two numbers you truly control, your allocation and your stop-loss, are the ones worth
              thinking hardest about.
            </p>
          </Reveal>

          <Reveal className="mt-12 text-center">
            <ButtonLink href="/traders" size="lg">
              Browse the leaderboard
            </ButtonLink>
          </Reveal>
        </div>
      </main>
      <Footer />
    </>
  );
}
