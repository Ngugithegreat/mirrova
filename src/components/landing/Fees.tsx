import Reveal from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";

const ROWS = [
  ["Opening an account", "Free", "No minimum balance to sign up"],
  ["Browsing traders & data", "Free", "Full track records, no paywall"],
  ["Management fee", "0%", "We never charge a % of your assets"],
  ["Deposits & withdrawals", "Free", "Bank transfer, card and mobile money"],
  ["Performance fee", "10–30%", "Set by each trader, charged only on profits, high-water mark"],
  ["Spread markup", "From 0.1%", "Shown per instrument before you copy"],
];

export default function Fees() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
      <div className="grid items-start gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mint">Pricing</p>
          <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-[2.6rem] sm:leading-[1.15]">
            You pay when you profit. Not before.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-2">
            No subscriptions, no management fees, no deposit charges. Traders earn a share of the profits
            they generate for you — calculated against a high-water mark, so you never pay twice for the
            same gain.
          </p>
          <div className="mt-8">
            <ButtonLink href="/pricing" variant="secondary">
              Full fee schedule →
            </ButtonLink>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="panel overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-3">
                  <th className="px-6 py-4 font-medium">Item</th>
                  <th className="px-4 py-4 font-medium">Cost</th>
                  <th className="hidden px-6 py-4 font-medium sm:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([item, cost, note]) => (
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
      </div>
    </section>
  );
}
