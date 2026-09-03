import type { Metadata } from "next";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import TraderExplorer from "@/components/traders/TraderExplorer";
import { PLATFORM_STATS } from "@/lib/traders";
import { fmtCount } from "@/lib/format";

export const metadata: Metadata = {
  title: "Top Traders",
  description:
    "Browse every vetted trader on Mirrova — full track records, risk scores, drawdowns and fees. Filter by style and market, then copy in one click.",
};

export default function TradersPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[72px]">
        <div className="border-b border-line-soft bg-surface/40">
          <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mint">The leaderboard</p>
            <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Top Traders</h1>
            <p className="mt-4 max-w-2xl text-lg text-ink-2">
              Every strategy below passed Mirrova&apos;s vetting: verified 12-month history, documented
              process, continuous risk monitoring. {fmtCount(PLATFORM_STATS.copiers)} investors copy them today.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <TraderExplorer />
          <p className="mt-10 text-xs leading-relaxed text-ink-3">
            Performance figures are net of fees and shown for illustration. Past performance is not a
            reliable indicator of future results. Capital at risk.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
