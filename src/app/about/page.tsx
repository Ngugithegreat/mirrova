import type { Metadata } from "next";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Reveal from "@/components/ui/Reveal";
import Auroras from "@/components/motion/Auroras";
import { ButtonLink } from "@/components/ui/Button";
import { PLATFORM_STATS } from "@/lib/traders";
import { fmtCompact, fmtCount } from "@/lib/format";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why Mirrova exists: radical transparency, copier-first protection, and a leaderboard that can't be gamed.",
};

const PRINCIPLES = [
  {
    title: "Transparency is non-negotiable",
    body: "Track records on Mirrova cannot be reset, hidden or cherry-picked. If a trader has a −20% month, every prospective copier sees it forever. We believe informed capital is the only capital worth having.",
  },
  {
    title: "The copier is the customer",
    body: "Platforms that earn from churn build casinos. We earn when copiers profit — so every product decision, from the copy stop-loss to the high-water mark, is engineered to protect the person doing the copying.",
  },
  {
    title: "Curation over volume",
    body: "A leaderboard with 100,000 strategies is a lottery. We list fewer than 2% of applicants and monitor every one continuously. Small roster, deep vetting, no lucky coin-flippers.",
  },
  {
    title: "Your money stays yours",
    body: "Funds sit in segregated accounts, traders never gain access to copier capital, and every relationship can be exited at market, instantly, around the clock.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[72px]">
        <div className="relative overflow-hidden border-b border-line-soft bg-surface/40">
          <Auroras />
          <div className="relative mx-auto max-w-7xl px-5 py-16 lg:px-8">
            <p className="eyebrow">About Mirrova</p>
            <h1 className="font-display mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.1]">
              Skill shouldn&apos;t be gated by who you know
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-2">
              For decades, access to great traders meant hedge-fund minimums and country-club
              introductions. Mirrova was built on a simpler idea: verify the skill, publish the record —
              drawdowns included — and let anyone allocate to it from $100, with protections institutions
              would envy.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="grid gap-x-8 gap-y-10 text-center sm:grid-cols-4">
            {[
              [fmtCompact(PLATFORM_STATS.aum), "Assets under copy"],
              [fmtCount(PLATFORM_STATS.copiers), "Active copiers"],
              [String(PLATFORM_STATS.traders), "Vetted strategies"],
              [`${PLATFORM_STATS.countries}+`, "Countries"],
            ].map(([v, l]) => (
              <div key={l}>
                <div className="tnum font-display text-4xl font-semibold text-ink">{v}</div>
                <div className="mt-2 text-sm text-ink-3">{l}</div>
              </div>
            ))}
          </div>

          <div className="mt-20 grid gap-5 sm:grid-cols-2">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.title} delay={(i % 2) * 90}>
                <div className="panel h-full p-8">
                  <h2 className="font-display text-xl font-semibold text-ink">{p.title}</h2>
                  <p className="mt-3 leading-relaxed text-ink-2">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="panel mt-16 p-8" >
            <div id="security">
              <h2 className="font-display text-2xl font-semibold">Security &amp; safeguards</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {[
                  ["Segregated client accounts", "Client funds held separately from operating capital with tier-1 banking partners."],
                  ["Encryption everywhere", "TLS 1.3 in transit, AES-256 at rest, hardware-backed key management."],
                  ["Two-factor authentication", "Enforced on login, withdrawals and copy changes; withdrawal address changes locked for 24h."],
                  ["Negative balance protection", "Losses on any copy relationship are capped at your allocation — you can never owe more."],
                  ["Continuous trader monitoring", "Strategy drift and risk-band violations suspend a trader from receiving new copies."],
                  ["Independent audits", "Regular third-party penetration testing and security review of the platform."],
                ].map(([t, b]) => (
                  <div key={t}>
                    <h3 className="font-semibold text-ink">{t}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{b}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal className="panel mt-8 p-8">
            <div id="contact">
              <h2 className="font-display text-2xl font-semibold">Contact</h2>
              <div className="mt-5 grid gap-6 text-sm sm:grid-cols-3">
                <div>
                  <div className="text-ink-3">Support</div>
                  <div className="mt-1 font-medium text-ink">support@mirrova.example</div>
                  <div className="mt-0.5 text-ink-2">24/7, replies within 2 hours</div>
                </div>
                <div>
                  <div className="text-ink-3">Trader applications</div>
                  <div className="mt-1 font-medium text-ink">pro@mirrova.example</div>
                  <div className="mt-0.5 text-ink-2">Include your verified track record</div>
                </div>
                <div>
                  <div className="text-ink-3">Press</div>
                  <div className="mt-1 font-medium text-ink">press@mirrova.example</div>
                </div>
              </div>
              <p className="mt-6 text-xs text-ink-3">
                Contact addresses are placeholders for this platform preview — replace with your live
                support desk before launch.
              </p>
            </div>
          </Reveal>

          <div className="mt-16 text-center">
            <ButtonLink href="/signup" size="lg">Join Mirrova</ButtonLink>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
