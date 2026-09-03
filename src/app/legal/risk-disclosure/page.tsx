import type { Metadata } from "next";
import LegalPage from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "Risk disclosure" };

export default function RiskPage() {
  return (
    <LegalPage
      title="Risk Disclosure"
      updated="September 2026"
      intro="Copy trading can generate losses as well as profits. Before using Mirrova you must understand and accept the risks described here. If anything in this document is unclear, do not trade — seek independent financial advice first."
      sections={[
        {
          heading: "Risk of loss",
          body: [
            "The value of investments can fall as well as rise. When you copy a trader you take on the full market risk of their strategy, scaled to your allocation. You may lose some or all of the money you allocate. Never invest funds you cannot afford to lose, and never invest borrowed money.",
          ],
        },
        {
          heading: "Past performance",
          body: [
            "A trader's historical returns, drawdown, win rate and risk score describe the past only. They are not a prediction, guarantee or reliable indicator of future performance. Strategies that performed well in one market regime can perform poorly or fail entirely in another.",
          ],
        },
        {
          heading: "Automatic execution",
          body: [
            "Copy trading executes trades in your account automatically, including while you are offline or asleep. Positions may be opened, closed or resized without your prior review. Your copy stop-loss limits, but does not eliminate, the resulting risk: in fast or gapping markets, execution may occur at prices worse than your configured level.",
          ],
        },
        {
          heading: "Leverage",
          body: [
            "Some strategies use leveraged instruments. Leverage amplifies both gains and losses and can cause rapid loss of the allocated amount. Negative balance protection caps your loss at your allocation, but the allocation itself is fully at risk.",
          ],
        },
        {
          heading: "Concentration and correlation",
          body: [
            "Copying multiple traders reduces risk only when their strategies are genuinely different. Traders operating in the same market or style can lose money simultaneously. Diversification reduces risk; it does not remove it.",
          ],
        },
        {
          heading: "Operational and market risks",
          body: [
            "Trading depends on technology: platform availability, connectivity and market infrastructure. Outages, extreme volatility, illiquidity or trading halts may delay or prevent execution, including of stop-losses. Digital-asset markets additionally trade around the clock with elevated volatility.",
          ],
        },
        {
          heading: "No advice",
          body: [
            "Nothing on Mirrova — including trader rankings, risk scores, editorial badges or Academy content — constitutes investment advice or a personal recommendation. The decision to copy any trader, and in what amount, is yours alone.",
          ],
        },
      ]}
    />
  );
}
