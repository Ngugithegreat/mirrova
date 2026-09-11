"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import TraderAvatar from "@/components/ui/TraderAvatar";
import { account, useAccountState } from "@/lib/accountClient";
import { fmtMoney } from "@/lib/format";
import { cx } from "@/lib/format";

const APP_LINKS = [
  { href: "/dashboard", label: "Portfolio" },
  { href: "/wallet", label: "Real Wallet" },
  { href: "/traders", label: "Traders" },
  { href: "/learn", label: "Academy" },
];

/**
 * The account-area chrome — deliberately NOT the marketing Navbar. Trimmed
 * nav (no Method/Fees/About), a persistent balance + Deposit action, and no
 * aurora/particle decoration: this should read as "inside the app," not
 * "still on the homepage."
 */
export default function AppNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const state = useAccountState();
  const signedIn = state.ready && !!state.user;
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  async function handleLogout() {
    await account.logOut();
    router.push("/");
  }

  return (
    <header className={cx("fixed inset-x-0 top-0 z-50 border-b border-line bg-surface", open && "border-b-0")}>
      <div className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between px-5 lg:px-8">
        <div className="flex items-center gap-2 lg:gap-8">
          <Logo />
          {signedIn && (
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Account">
              {APP_LINKS.map((l) => {
                const active = pathname === l.href || pathname.startsWith(l.href + "/");
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cx(
                      "rounded-full px-4 py-2 text-[13px] font-medium transition-colors",
                      active ? "bg-raised text-ink" : "text-ink-2 hover:text-ink"
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div className="hidden items-center gap-3 lg:flex lg:gap-4">
          {signedIn ? (
            <>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wide text-ink-3">Practice balance</div>
                <div className="tnum text-sm font-semibold text-ink">{fmtMoney(state.cashCents / 100, 2)}</div>
              </div>
              <ButtonLink href="/wallet" size="sm">
                Deposit
              </ButtonLink>
              <Link href="/dashboard" aria-label="Your portfolio">
                <TraderAvatar name={state.user!.name} size="sm" className="!h-9 !w-9 !text-[11px]" />
              </Link>
              <button
                onClick={handleLogout}
                className="text-[13px] text-ink-3 underline-offset-4 hover:text-ink hover:underline"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[13px] font-medium text-ink-2 underline-offset-4 hover:text-ink hover:underline">
                Log in
              </Link>
              <ButtonLink href="/signup" size="sm">
                Begin copying
              </ButtonLink>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          {signedIn && (
            <>
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-wide text-ink-3">Balance</div>
                <div className="tnum text-xs font-semibold text-ink">{fmtMoney(state.cashCents / 100, 2)}</div>
              </div>
              <ButtonLink href="/wallet" size="sm">
                Deposit
              </ButtonLink>
            </>
          )}
          <button
            className="p-2 text-ink-2 hover:text-ink"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle menu"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-surface px-5 pb-6 pt-3 lg:hidden">
          {signedIn ? (
            <>
              <Link href="/dashboard" className="flex items-center gap-3 border-b border-line-soft py-4">
                <TraderAvatar name={state.user!.name} size="md" />
                <div>
                  <div className="text-sm font-semibold text-ink">{state.user!.name}</div>
                  <div className="text-xs text-ink-3">{state.user!.email}</div>
                </div>
              </Link>
              <nav className="flex flex-col" aria-label="Account mobile">
                {APP_LINKS.map((l) => {
                  const active = pathname === l.href || pathname.startsWith(l.href + "/");
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={cx(
                        "border-b border-line-soft px-1 py-3.5 text-[13px] font-semibold uppercase tracking-[0.18em]",
                        active ? "text-mint" : "text-ink-2 hover:text-ink"
                      )}
                    >
                      {l.label}
                    </Link>
                  );
                })}
              </nav>
              <button
                onClick={handleLogout}
                className="mt-5 w-full rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink-2"
              >
                Log out
              </button>
            </>
          ) : (
            <div className="flex gap-3">
              <ButtonLink href="/login" variant="secondary" className="flex-1">
                Log in
              </ButtonLink>
              <ButtonLink href="/signup" className="flex-1">
                Begin copying
              </ButtonLink>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
