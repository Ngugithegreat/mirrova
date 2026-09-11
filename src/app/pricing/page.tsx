import type { Metadata } from "next";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { ButtonLink } from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import Auroras from "@/components/motion/Auroras";
import { TIERS } from "@/lib/tiers";

export const metadata: Metadata = {
  title: "Pricing & fees",
  description:
    "Asport Traders' complete fee schedule: $0 management fees, free deposits and withdrawals, performance fees only on profits above a high-water mark.",
};

const SCHEDULE: { section: string; rows: [string, string, string][] }[] = [
  {
    section: "Account",
    rows: [
      ["Opening an account", "Free", "No minimum balance"],
      ["Account maintenance", "Free", "No monthly or annual charges"],
      ["Browsing traders & full track records", "Free", "No paywall, no tiers"],
      ["Inactivity", "Free", "We don't punish patience"],
    ],
  },
  {
    section: "Money movement",
    rows: [
      ["Deposits — bank transfer, card, mobile money", "Free", "Third-party/bank charges may apply on their side"],
      ["Withdrawals", "Free", "Processed within 1 business day"],
      ["Currency conversion", "0.3%", "Only when depositing in a non-USD currency"],
    ],
  },
  {
    section: "Copying",
    rows: [
      ["Management fee", "0%", "Never a percentage of assets"],
      ["Performance fee", "10–30%", "Set per trader · profits only · reduced by your tier below"],
      ["Spread markup", "From 0.1%", "Displayed per instrument before you copy"],
      ["Overnight financing", "Varies", "Only on leveraged positions; shown per instrument"],
      ["Stopping a copy / exiting", "Free", "Any time, at market, no notice period"],
    ],
  },
];

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[72px]">
        <div className="relative overflow-hidden border-b border-line-soft bg-surface/40">
          <Auroras />
          <div className="relative mx-auto max-w-7xl px-5 py-14 lg:px-8">
            <p className="eyebrow">Pricing</p>
            <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Simple, aligned, no surprises
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-ink-2">
              We make money when your traders make you money — through their performance fee — and from
              transparent spreads. Never from your balance sitting still.
            </p>
          </div>
        </div>

        <section id="tiers" className="border-b border-line-soft bg-surface/20 py-16">
          <div className="mx-auto max-w-6xl px-5 lg:px-8">
            <Reveal>
              <p className="eyebrow">Tiers</p>
              <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Earned by what you commit, not what you promise
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-ink-2">
                There&apos;s no subscription to buy. Your tier is computed automatically from your lifetime
                real deposits and unlocks more concurrent practice copies, a lower performance fee, and more
                of the Desk — automatically, the moment you cross the threshold.
              </p>
            </Reveal>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {TIERS.map((t, i) => (
                <Reveal key={t.id} delay={i * 100} className={`panel p-7 ${t.id === "momentum" ? "glow-ring" : ""}`}>
                  {t.id === "momentum" && (
                    <span className="mb-3 inline-block rounded-full border border-mint/30 bg-mint/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-mint">
                      Most reached
                    </span>
                  )}
                  <h3 className="font-display text-xl font-semibold text-ink">{t.name}</h3>
                  <p className="mt-1.5 text-sm text-ink-2">{t.blurb}</p>

                  <div className="mt-5 border-t border-line-soft pt-5">
                    <div className="fig text-2xl font-semibold text-ink">
                      {t.minDepositUsdCents === 0 ? "$0" : `$${(t.minDepositUsdCents / 100).toLocaleString()}+`}
                    </div>
                    <div className="mt-0.5 text-xs text-ink-3">lifetime real deposits</div>
                  </div>

                  <ul className="mt-5 space-y-2.5 text-sm text-ink-2">
                    <li>
                      <span className="tnum font-semibold text-ink">
                        {t.maxConcurrentCopies >= 999 ? "Unlimited" : t.maxConcurrentCopies}
                      </span>{" "}
                      concurrent practice copies
                    </li>
                    <li>
                      <span className="tnum font-semibold text-ink">{t.feeDiscountPts}pt</span> performance-fee
                      discount
                    </li>
                    <li>
                      <span className="tnum font-semibold text-ink">{t.deskInstrumentCount}</span> Desk
                      instruments · <span className="tnum font-semibold text-ink">{t.deskLeverage}×</span> practice
                      leverage
                    </li>
                    <li>
                      {t.deskOrdersWithSlTp ? (
                        <span className="text-ink">Stop-loss &amp; take-profit orders on the Desk</span>
                      ) : (
                        <span className="text-ink-3">Market orders only on the Desk</span>
                      )}
                    </li>
                  </ul>
                </Reveal>
              ))}
            </div>

            <p className="mt-6 max-w-2xl text-xs leading-relaxed text-ink-3">
              Tier perks apply to your practice tools, where performance is simulated. Real-money copying
              stays exactly as protected as ever — one allocation, your full principal, no fees ever taken
              from real funds by a tier.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-5 py-14">
          {SCHEDULE.map((s, i) => (
            <Reveal key={s.section} delay={i * 80} className="mb-10">
              <h2 className="font-display mb-4 text-xl font-semibold">{s.section}</h2>
              <div className="panel overflow-hidden">
                <table className="w-full text-left text-sm">
                  <tbody>
                    {s.rows.map(([item, cost, note]) => (
                      <tr key={item} className="border-b border-line-soft last:border-0">
                        <td className="px-6 py-4 text-ink">{item}</td>
                        <td className={`tnum px-4 py-4 font-semibold ${cost === "Free" || cost === "0%" ? "text-mint" : "text-ink"}`}>
                          {cost}
                        </td>
                        <td className="hidden px-6 py-4 text-ink-2 sm:table-cell">{note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          ))}

          <Reveal className="panel p-8">
            <h2 className="font-display text-xl font-semibold">The high-water mark, in one example</h2>
            <p className="mt-3 leading-relaxed text-ink-2">
              You copy with $2,000 at a 20% performance fee. It grows to $2,300 → you pay $60 (20% of the
              $300 profit); your mark is now $2,300. It dips to $2,100 → you pay nothing. It recovers to
              $2,280 → still nothing, you&apos;re below the mark. Only above $2,300 does a fee apply again —
              a trader can never charge twice for the same gain, and never charges for recovering losses.
            </p>
          </Reveal>

          <Reveal className="mt-12 text-center">
            <ButtonLink href="/signup" size="lg">Create free account</ButtonLink>
            <p className="mt-4 text-xs text-ink-3">Capital at risk. Fee schedule shown for the platform preview.</p>
          </Reveal>
        </div>
      </main>
      <Footer />
    </>
  );
}
