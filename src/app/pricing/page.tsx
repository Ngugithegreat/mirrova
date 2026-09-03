import type { Metadata } from "next";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { ButtonLink } from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Pricing & fees",
  description:
    "Mirrova's complete fee schedule: $0 management fees, free deposits and withdrawals, performance fees only on profits above a high-water mark.",
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
      ["Performance fee", "10–30%", "Set per trader · profits only · high-water mark"],
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
        <div className="border-b border-line-soft bg-surface/40">
          <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mint">Pricing</p>
            <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Simple, aligned, no surprises
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-ink-2">
              We make money when your traders make you money — through their performance fee — and from
              transparent spreads. Never from your balance sitting still.
            </p>
          </div>
        </div>

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
