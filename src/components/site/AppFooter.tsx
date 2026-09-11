import Link from "next/link";

/** Minimal footer for the account area — a utility, not a marketing page. */
export default function AppFooter() {
  return (
    <footer className="border-t border-line-soft">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-ink-3 sm:flex-row lg:px-8">
        <p>© {new Date().getFullYear()} Asport Traders. Capital at risk.</p>
        <div className="flex gap-5">
          <Link href="/legal/terms" className="hover:text-ink-2">Terms</Link>
          <Link href="/legal/privacy" className="hover:text-ink-2">Privacy</Link>
          <Link href="/legal/risk-disclosure" className="hover:text-ink-2">Risk disclosure</Link>
          <Link href="/about" className="hover:text-ink-2">About</Link>
        </div>
      </div>
    </footer>
  );
}
