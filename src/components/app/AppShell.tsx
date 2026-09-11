"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { account, useAccountState } from "@/lib/accountClient";
import { useRealAccountState } from "@/lib/realAccountClient";
import { useSessionMode, setSessionMode } from "@/lib/sessionMode";
import { LogoMark } from "@/components/ui/Logo";
import TraderAvatar from "@/components/ui/TraderAvatar";
import { ButtonLink } from "@/components/ui/Button";
import AppFooter from "@/components/site/AppFooter";
import { fmtMoney, cx } from "@/lib/format";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "grid" },
  { href: "/traders", label: "Copy traders", icon: "users" },
  { href: "/desk", label: "Trading desk", icon: "chart" },
  { href: "/portfolio", label: "Portfolio", icon: "bars" },
  { href: "/wallet", label: "Wallet", icon: "wallet" },
  { href: "/verify", label: "Verify identity", icon: "shield" },
  { href: "/settings", label: "Settings", icon: "gear" },
] as const;

function NavIcon({ name, className }: { name: (typeof NAV)[number]["icon"]; className?: string }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "grid":
      return (
        <svg className={className} {...common}>
          <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
          <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5" />
          <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" />
          <rect x="13" y="13" width="7.5" height="7.5" rx="1.5" />
        </svg>
      );
    case "users":
      return (
        <svg className={className} {...common}>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3.5 20c0-3.3 2.5-5.8 5.5-5.8s5.5 2.5 5.5 5.8" />
          <circle cx="17.5" cy="8.5" r="2.5" />
          <path d="M15.8 14.6c2.6.3 4.7 2.5 4.7 5.4" />
        </svg>
      );
    case "chart":
      return (
        <svg className={className} {...common}>
          <path d="M4 20V10M10 20V4M16 20v-7M20.5 20V13" />
        </svg>
      );
    case "wallet":
      return (
        <svg className={className} {...common}>
          <rect x="3" y="6" width="18" height="13" rx="2.2" />
          <path d="M3 10h18" />
          <circle cx="16.5" cy="14.2" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "shield":
      return (
        <svg className={className} {...common}>
          <path d="M12 3.5l7 2.8v5.4c0 4.4-2.9 7.9-7 9.3-4.1-1.4-7-4.9-7-9.3V6.3z" />
          <path d="M8.8 12.2l2.1 2.1 4.3-4.3" />
        </svg>
      );
    case "bars":
      return (
        <svg className={className} {...common}>
          <path d="M4 20V13M11.5 20V4M19 20v-9" />
        </svg>
      );
    case "gear":
      return (
        <svg className={className} {...common}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 3.5v2.3M12 18.2v2.3M20.5 12h-2.3M5.8 12H3.5M17.7 6.3l-1.6 1.6M7.9 16.1l-1.6 1.6M17.7 17.7l-1.6-1.6M7.9 7.9 6.3 6.3" />
        </svg>
      );
  }
}

const KYC_DOT: Record<string, string> = {
  unsubmitted: "bg-ink-3",
  pending: "bg-warn animate-pulse",
  verified: "bg-mint",
  rejected: "bg-neg",
};

function ShellSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <LogoMark className="h-10 w-10 animate-pulse" />
    </div>
  );
}

function Sidebar({ pathname, mobile, onNavigate }: { pathname: string; mobile?: boolean; onNavigate?: () => void }) {
  const state = useAccountState();
  const real = useRealAccountState();
  const mode = useSessionMode();
  const isLive = mode === "real";
  const copyCount = isLive ? (real.allocation ? 1 : 0) : state.copies.length;

  return (
    <div className={cx("flex h-full flex-col border-line-soft bg-surface", mobile ? "w-full" : "w-[240px] border-r")}>
      <div className="flex items-center gap-2.5 px-5 py-6">
        <LogoMark className="h-8 w-8" />
        <span className="font-display text-[1.05rem] font-semibold tracking-tight text-ink">asport traders</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Account">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const badge = item.href === "/traders" && copyCount > 0 ? copyCount : null;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cx(
                "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-raised text-ink" : "text-ink-2 hover:bg-raised/60 hover:text-ink"
              )}
            >
              {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-violet via-mint to-fuchsia" />}
              <NavIcon name={item.icon} className={cx("h-[18px] w-[18px] shrink-0", active ? "text-mint" : "text-ink-3")} />
              <span className="flex-1">{item.label}</span>
              {badge != null && (
                <span className="rounded-full bg-mint/15 px-1.5 py-0.5 text-[10px] font-bold text-mint">{badge}</span>
              )}
              {item.href === "/verify" && real.ready && (
                <span className={cx("h-2 w-2 shrink-0 rounded-full", KYC_DOT[real.kycStatus])} aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <div className="panel p-4">
          <div className="text-[10px] uppercase tracking-wide text-ink-3">{isLive ? "Real balance" : "Practice balance"}</div>
          <div className="tnum mt-1 text-lg font-semibold text-ink">
            {isLive ? fmtMoney(real.realCashCents / 100, 2) : fmtMoney(state.cashCents / 100, 2)}
          </div>
          <ButtonLink href="/wallet" size="sm" className="mt-3 w-full">
            Deposit funds
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

function TopBar({ pathname }: { pathname: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const state = useAccountState();
  const real = useRealAccountState();
  const mode = useSessionMode();
  const isLive = mode === "real";

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

  const demoInvested = state.copies.reduce((s, c) => s + c.currentValueCents, 0);
  const demoPnl = state.copies.reduce((s, c) => s + (c.currentValueCents - c.amountCents), 0);

  const stats = isLive
    ? [
        { label: "Account value", value: real.realCashCents + (real.allocation?.amountCents ?? 0) },
        { label: "Available", value: real.realCashCents },
        { label: "Copying", value: real.allocation?.amountCents ?? 0 },
        { label: "Open P&L", value: real.engine.open?.unrealizedPnlCents ?? 0, signed: true },
      ]
    : [
        { label: "Account value", value: state.cashCents + demoInvested },
        { label: "Available", value: state.cashCents },
        { label: "Copying", value: demoInvested },
        { label: "Open P&L", value: demoPnl, signed: true },
      ];

  const tierName = (isLive ? real.accountType : state.accountType)?.name ?? "—";
  const firstName = state.user?.name.split(" ")[0] ?? "";

  return (
    <>
      <header className="flex h-[68px] items-center justify-between gap-4 border-b border-line-soft bg-bg/92 px-4 backdrop-blur-sm lg:px-6">
        <button className="p-2 text-ink-2 hover:text-ink lg:hidden" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square">
            <path d="M4 8h16M4 16h16" />
          </svg>
        </button>

        <div className="flex flex-1 items-center justify-end gap-2 lg:hidden">
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wide text-ink-3">{isLive ? "Real balance" : "Practice balance"}</div>
            <div className="tnum text-[13px] font-semibold text-ink">{fmtMoney(stats[0].value / 100, 2)}</div>
          </div>
        </div>

        <div className="hidden flex-1 items-center gap-6 lg:flex">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-[10px] uppercase tracking-wide text-ink-3">{s.label}</div>
              <div
                className={cx(
                  "tnum text-[15px] font-semibold",
                  s.signed ? (s.value >= 0 ? "text-pos" : "text-neg") : "text-ink"
                )}
              >
                {s.signed && s.value >= 0 ? "+" : s.signed ? "−" : ""}
                {fmtMoney(Math.abs(s.value) / 100, 2)}
              </div>
            </div>
          ))}
          <span className={cx("rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide", isLive ? "bg-mint/10 text-mint" : "bg-warn/10 text-warn")}>
            {isLive ? "Real account" : "Demo · practice funds"}
          </span>

          <div className="relative ml-1 flex items-center rounded-full border border-line bg-raised/60 p-1">
            <span
              aria-hidden="true"
              className={cx(
                "absolute inset-y-1 left-1 w-[48px] rounded-full bg-gradient-to-r from-violet via-mint to-fuchsia transition-transform duration-200 ease-out",
                isLive ? "translate-x-0" : "translate-x-[52px]"
              )}
            />
            <button
              onClick={() => setSessionMode("real")}
              className={cx(
                "relative z-10 w-[48px] rounded-full py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
                isLive ? "text-[#06060c]" : "text-ink-2 hover:text-ink"
              )}
            >
              Real
            </button>
            <button
              onClick={() => setSessionMode("demo")}
              className={cx(
                "relative z-10 w-[48px] rounded-full py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
                !isLive ? "text-[#06060c]" : "text-ink-2 hover:text-ink"
              )}
            >
              Demo
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} aria-label="Account menu" className="flex items-center gap-2.5">
              <TraderAvatar name={state.user?.name ?? "?"} size="sm" className="!h-9 !w-9 !text-[11px]" />
              <div className="hidden text-left sm:block">
                <div className="text-[13px] font-semibold text-ink">{firstName}</div>
                <div className="text-[11px] text-ink-3">{tierName}</div>
              </div>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-56 rounded-xl border border-line bg-surface p-1.5 shadow-2xl">
                <div className="border-b border-line-soft px-3 py-2.5">
                  <div className="truncate text-sm font-semibold text-ink">{state.user?.name}</div>
                  <div className="truncate text-xs text-ink-3">{state.user?.email}</div>
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
        </div>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80vw]">
            <Sidebar pathname={pathname} mobile onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const state = useAccountState();

  useEffect(() => {
    if (state.ready && !state.user) router.replace("/login");
  }, [state.ready, state.user, router]);

  if (!state.ready || !state.user) {
    return <ShellSkeleton />;
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <div className="hidden lg:block">
        <Sidebar pathname={pathname} />
      </div>
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar pathname={pathname} />
        <main className="flex-1">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}
