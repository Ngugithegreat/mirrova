"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import TraderAvatar from "@/components/ui/TraderAvatar";
import { account, useAccountState } from "@/lib/accountClient";
import { cx } from "@/lib/format";

const LINKS = [
  { href: "/traders", label: "Traders" },
  { href: "/how-it-works", label: "Method" },
  { href: "/pricing", label: "Fees" },
  { href: "/learn", label: "Academy" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const state = useAccountState();
  const signedIn = state.ready && !!state.user;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  async function handleLogout() {
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
          {LINKS.map((l) => {
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

        <div className="hidden items-center gap-5 lg:flex">
          {signedIn ? (
            <>
              <Link
                href="/wallet"
                className="text-[13px] font-medium text-mint underline-offset-4 hover:underline"
              >
                Real wallet
              </Link>
              <Link href="/dashboard" className="flex items-center gap-2.5 group">
                <TraderAvatar name={state.user!.name} size="sm" className="!h-8 !w-8 !text-[10px]" />
                <span className="text-[13px] font-medium text-ink-2 group-hover:text-ink">
                  {state.user!.name.split(" ")[0]}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-[13px] text-ink-3 underline-offset-4 hover:text-ink hover:underline"
              >
                Log out
              </button>
              <ButtonLink href="/dashboard" size="sm">
                Portfolio
              </ButtonLink>
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

        <button
          className="p-2 text-ink-2 hover:text-ink lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-bg px-5 pb-6 pt-3 lg:hidden">
          {signedIn && (
            <Link href="/dashboard" className="flex items-center gap-3 border-b border-line-soft py-4">
              <TraderAvatar name={state.user!.name} size="md" />
              <div>
                <div className="text-sm font-semibold text-ink">{state.user!.name}</div>
                <div className="text-xs text-ink-3">{state.user!.email}</div>
              </div>
            </Link>
          )}
          <nav className="flex flex-col" aria-label="Mobile">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="border-b border-line-soft px-1 py-3.5 text-[13px] font-semibold uppercase tracking-[0.18em] text-ink-2 hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
            {signedIn && (
              <Link
                href="/wallet"
                className="border-b border-line-soft px-1 py-3.5 text-[13px] font-semibold uppercase tracking-[0.18em] text-mint"
              >
                Real Wallet
              </Link>
            )}
          </nav>
          <div className="mt-5 flex gap-3">
            {signedIn ? (
              <>
                <button
                  onClick={handleLogout}
                  className="flex-1 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink-2"
                >
                  Log out
                </button>
                <ButtonLink href="/dashboard" className="flex-1">
                  Portfolio
                </ButtonLink>
              </>
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
