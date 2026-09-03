import Reveal from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";

const ROWS = [
  ["Opening an account", "Free", "No minimum balance to sign up"],
  ["Browsing traders & data", "Free", "Full track records, no paywall"],
  ["Management fee", "0%", "We never charge a % of your assets"],
  ["Deposits & withdrawals", "Free", "Bank transfer, card and mobile money"],
  ["Performance fee", "10–30%", "Set by each trader · profits only · high-water mark"],
  ["Spread markup", "From 0.1%", "Shown per instrument before you copy"],
];

export default function Fees() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-20 lg:px-8 lg:py-28">
      <div className="grid items-start gap-14 lg:grid-cols-[0.42fr_0.58fr] lg:gap-20">
        <Reveal>
          <p className="eyebrow">Fees</p>
          <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-[2.75rem] sm:leading-[1.1]">
            You pay when you profit. Not before.
          </h2>
          <p className="mt-6 leading-relaxed text-ink-2">
            No subscriptions, no management fees, no deposit charges. Strategists earn a share of the
            profits they create for you — measured against a high-water mark, so the same gain is never
            paid for twice.
          </p>
          <div className="mt-8">
            <ButtonLink href="/pricing" variant="secondary">
              The full fee schedule
            </ButtonLink>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="rule-heavy">
                <th className="py-4 pr-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-3">Item</th>
                <th className="py-4 pr-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-3">Cost</th>
                <th className="hidden py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-3 sm:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([item, cost, note]) => (
                <tr key={item} className="border-t border-line">
                  <td className="py-4 pr-4 font-medium text-ink">{item}</td>
                  <td className={`fig py-4 pr-4 text-base font-semibold ${cost === "Free" || cost === "0%" ? "text-mint" : "text-ink"}`}>
                    {cost}
                  </td>
                  <td className="hidden py-4 text-ink-2 sm:table-cell">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}
