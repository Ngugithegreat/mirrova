"use client";

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

  async function handleLogout() {
    await account.logOut();
    router.push("/");
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-surface">
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

        <div className="flex items-center gap-3 lg:gap-4">
          {signedIn ? (
            <>
              <div className="hidden text-right sm:block">
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
                className="hidden text-[13px] text-ink-3 underline-offset-4 hover:text-ink hover:underline sm:inline"
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
      </div>
    </header>
  );
}
