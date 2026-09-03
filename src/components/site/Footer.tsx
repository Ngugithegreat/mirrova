import Link from "next/link";
import Logo from "@/components/ui/Logo";

const COLS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Platform",
    links: [
      { href: "/traders", label: "Top Traders" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing & fees" },
      { href: "/dashboard", label: "Portfolio" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/learn", label: "Academy" },
      { href: "/learn/what-is-copy-trading", label: "What is copy trading?" },
      { href: "/learn/choosing-a-trader", label: "Choosing a trader" },
      { href: "/learn/risk-management", label: "Managing risk" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Mirrova" },
      { href: "/about#security", label: "Security" },
      { href: "/about#contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms of service" },
      { href: "/legal/privacy", label: "Privacy policy" },
      { href: "/legal/risk-disclosure", label: "Risk disclosure" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface/40">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-2">
              The professional copy trading platform. Mirror the strategies of vetted traders with
              institutional-grade risk controls.
            </p>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-ink">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="text-sm text-ink-2 transition-colors hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 border-t border-line-soft pt-8">
          <p className="text-xs leading-relaxed text-ink-3">
            <strong className="text-ink-2">Risk warning:</strong> Copy trading involves significant risk of
            loss and is not suitable for all investors. Past performance of any trader is not a reliable
            indicator of future results, and you may lose some or all of your invested capital. Performance
            figures shown are illustrative. You should not invest money you cannot afford to lose. Nothing on
            this site constitutes investment advice or a personal recommendation. This is a demonstration
            platform preview; account features operate in practice mode.
          </p>
          <div className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-xs text-ink-3">© {new Date().getFullYear()} Mirrova. All rights reserved.</p>
            <div className="flex gap-5 text-xs text-ink-3">
              <Link href="/legal/terms" className="hover:text-ink-2">Terms</Link>
              <Link href="/legal/privacy" className="hover:text-ink-2">Privacy</Link>
              <Link href="/legal/risk-disclosure" className="hover:text-ink-2">Risk disclosure</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
