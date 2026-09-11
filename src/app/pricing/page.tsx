import type { Metadata } from "next";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { ButtonLink } from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import Auroras from "@/components/motion/Auroras";
import { ACCOUNT_TYPES } from "@/lib/accountTypes";

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
      ["Performance fee", "10–30%", "Set per trader · profits only"],
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

        <section id="account-types" className="border-b border-line-soft bg-surface/20 py-16">
          <div className="mx-auto max-w-6xl px-5 lg:px-8">
            <Reveal>
              <p className="eyebrow">Account types</p>
              <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Pick the account, not a tier of you
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-ink-2">
                Every account gets the full platform — every trader, every tool. The difference is how much
                you deposit, how many strategists you can run at once, and how much leverage the Desk gives
                you to practise with.
              </p>
            </Reveal>

            <div className="mt-10 grid gap-5 lg:grid-cols-4">
              {ACCOUNT_TYPES.map((t, i) => (
                <Reveal key={t.id} delay={i * 100} className={`panel p-6 ${t.popular ? "glow-ring" : ""}`}>
                  {t.popular && (
                    <span className="mb-3 inline-block rounded-full border border-mint/30 bg-mint/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-mint">
                      Most popular
                    </span>
                  )}
                  <h3 className="font-display text-xl font-semibold text-ink">{t.name}</h3>
                  <p className="mt-1.5 text-sm text-ink-2">{t.tagline}</p>

                  <div className="mt-5 space-y-2 border-t border-line-soft pt-5 text-sm">
                    <div className="flex justify-between"><span className="text-ink-3">Spread</span><span className="tnum text-ink">from {t.spreadFrom}</span></div>
                    <div className="flex justify-between"><span className="text-ink-3">Commission</span><span className="text-ink">{t.commission}</span></div>
                    <div className="flex justify-between"><span className="text-ink-3">Min. deposit</span><span className="tnum text-ink">${(t.minDepositUsdCents / 100).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-ink-3">Max. leverage</span><span className="tnum text-ink">1:{t.maxLeverage}</span></div>
                    <div className="flex justify-between">
                      <span className="text-ink-3">Copy providers</span>
                      <span className="tnum text-ink">{t.maxConcurrentCopies >= 999 ? "Unlimited" : `Up to ${t.maxConcurrentCopies}`}</span>
                    </div>
                  </div>

                  <ul className="mt-5 space-y-2 border-t border-line-soft pt-5 text-sm text-ink-2">
                    {t.highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>

                  <ButtonLink href={`/signup?type=${t.id}`} className="mt-6 w-full">
                    Open {t.name}
                  </ButtonLink>
                </Reveal>
              ))}
            </div>

            <p className="mt-6 max-w-2xl text-xs leading-relaxed text-ink-3">
              Leverage and copy limits above apply to your practice tools (the Desk and copy-trading),
              where performance is simulated. Real-money copying stays exactly as protected as ever — one
              allocation, your full principal — and your account&apos;s minimum deposit is what activates it
              for real copying.
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
