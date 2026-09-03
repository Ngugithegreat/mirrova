import type { Metadata } from "next";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import TraderExplorer from "@/components/traders/TraderExplorer";
import Auroras from "@/components/motion/Auroras";
import Reveal from "@/components/ui/Reveal";
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
        <div className="relative overflow-hidden border-b border-line-soft bg-surface/40">
          <Auroras />
          <Reveal className="relative mx-auto max-w-7xl px-5 py-14 lg:px-8">
            <p className="eyebrow">The register</p>
            <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Top Traders</h1>
            <p className="mt-4 max-w-2xl text-lg text-ink-2">
              Every strategy below passed Mirrova&apos;s vetting: verified 12-month history, documented
              process, continuous risk monitoring. {fmtCount(PLATFORM_STATS.copiers)} investors copy them today.
            </p>
          </Reveal>
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
