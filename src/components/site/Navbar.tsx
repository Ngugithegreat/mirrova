"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import TraderAvatar from "@/components/ui/TraderAvatar";
import { account, useAccountState } from "@/lib/accountClient";
import { useRealAccountState } from "@/lib/realAccountClient";
import { useSessionMode } from "@/lib/sessionMode";
import { fmtMoney } from "@/lib/format";
import { cx } from "@/lib/format";

const GUEST_LINKS = [
  { href: "/traders", label: "Traders" },
  { href: "/how-it-works", label: "Method" },
  { href: "/pricing", label: "Fees" },
  { href: "/learn", label: "Academy" },
  { href: "/about", label: "About" },
];

const MEMBER_LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/desk", label: "Desk" },
  { href: "/traders", label: "Traders" },
  { href: "/learn", label: "Academy" },
];

/**
 * One navbar for the whole site. Signed-in state does NOT bolt extra
 * controls onto the marketing nav — it swaps to a trimmed member nav and
 * consolidates account actions behind a single avatar menu, the way an
 * actual trading platform's top bar works.
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const state = useAccountState();
  const real = useRealAccountState();
  const signedIn = state.ready && !!state.user;
  const links = signedIn ? MEMBER_LINKS : GUEST_LINKS;
  const mode = useSessionMode();
  const isLive = mode === "real";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await account.logOut();
    router.push("/");
  }

  return (
    <header
      className={cx(
        "fixed inset-x-0 top-0 z-50 border-b bg-bg/92 backdrop-blur-sm transition-shadow duration-300",
        scrolled || open ? "border-line shadow-[0_1px_0_rgba(22,21,15,0.04)]" : "border-line-soft"
      )}
    >
      <div className="mx-auto flex h-[76px] max-w-[1200px] items-center justify-between px-5 lg:px-8">
        <Logo />

        <nav className="hidden items-center lg:flex" aria-label="Primary">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cx(
                  "px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors",
                  active ? "text-mint" : "text-ink-2 hover:text-ink"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {signedIn ? (
            <>
              <div className="mr-1 hidden text-right xl:block">
                <div className="text-[9px] uppercase tracking-wide text-ink-3">
                  {isLive ? "Live balance" : "Practice balance"}
                </div>
                <div className="tnum text-[13px] font-semibold text-ink">
                  {isLive ? fmtMoney(real.realCashCents / 100, 2) : fmtMoney(state.cashCents / 100, 2)}
                </div>
              </div>
              <ButtonLink href="/wallet" size="sm">
                Deposit
              </ButtonLink>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-label="Account menu"
                  className="block"
                >
                  <TraderAvatar name={state.user!.name} size="sm" className="!h-9 !w-9 !text-[11px]" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] w-56 rounded-xl border border-line bg-surface p-1.5 shadow-2xl">
                    <div className="border-b border-line-soft px-3 py-2.5">
                      <div className="truncate text-sm font-semibold text-ink">{state.user!.name}</div>
                      <div className="truncate text-xs text-ink-3">{state.user!.email}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="mt-0.5 block w-full rounded-lg px-3 py-2 text-left text-sm text-ink-2 hover:bg-raised hover:text-neg"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
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
            <ButtonLink href="/wallet" size="sm">
              Deposit
            </ButtonLink>
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
        <div className="border-t border-line bg-bg px-5 pb-6 pt-3 lg:hidden">
          {signedIn && (
            <Link href="/dashboard" className="flex min-w-0 items-center gap-3 border-b border-line-soft py-4">
              <TraderAvatar name={state.user!.name} size="md" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink">{state.user!.name}</div>
                <div className="truncate text-xs text-ink-3">{state.user!.email}</div>
              </div>
            </Link>
          )}
          <nav className="flex flex-col" aria-label="Mobile">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="border-b border-line-soft px-1 py-3.5 text-[13px] font-semibold uppercase tracking-[0.18em] text-ink-2 hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-5 flex gap-3">
            {signedIn ? (
              <button
                onClick={handleLogout}
                className="w-full rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink-2"
              >
                Log out
              </button>
            ) : (
              <>
                <ButtonLink href="/login" variant="secondary" className="flex-1">
                  Log in
                </ButtonLink>
                <ButtonLink href="/signup" className="flex-1">
                  Begin copying
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
