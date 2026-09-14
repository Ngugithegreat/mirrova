"use client";

import { useState } from "react";
import { LogoMark } from "@/components/ui/Logo";
import { cx } from "@/lib/format";
import OverviewTab from "./OverviewTab";
import UsersTab from "./UsersTab";
import DepositsTab from "./DepositsTab";
import WithdrawalsTab from "./WithdrawalsTab";
import ActivityTab from "./ActivityTab";
import DeskTab from "./DeskTab";
import KycTab from "./KycTab";
import EngineTab from "./EngineTab";
import SignalTestingTab from "./SignalTestingTab";

const TABS = [
  { key: "overview", label: "Overview", icon: "grid" },
  { key: "users", label: "Users", icon: "users" },
  { key: "deposits", label: "Deposits", icon: "download" },
  { key: "withdrawals", label: "Withdrawals", icon: "upload" },
  { key: "kyc", label: "KYC", icon: "shield" },
  { key: "activity", label: "Copy activity", icon: "pulse" },
  { key: "desk", label: "Desk", icon: "bars" },
  { key: "engine", label: "Trade engine", icon: "chart" },
  { key: "signals", label: "Signal testing", icon: "gear" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function TabIcon({ name, className }: { name: (typeof TABS)[number]["icon"]; className?: string }) {
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
    case "download":
      return (
        <svg className={className} {...common}>
          <path d="M12 3.5v12M7.5 11l4.5 4.5L16.5 11" />
          <path d="M4 19.5h16" />
        </svg>
      );
    case "upload":
      return (
        <svg className={className} {...common}>
          <path d="M12 20.5v-12M7.5 13l4.5-4.5L16.5 13" />
          <path d="M4 4.5h16" />
        </svg>
      );
    case "shield":
      return (
        <svg className={className} {...common}>
          <path d="M12 3.5l7 2.8v5.4c0 4.4-2.9 7.9-7 9.3-4.1-1.4-7-4.9-7-9.3V6.3z" />
          <path d="M8.8 12.2l2.1 2.1 4.3-4.3" />
        </svg>
      );
    case "pulse":
      return (
        <svg className={className} {...common}>
          <path d="M3 12h4l2.5-6 3 12 2.5-8 1.5 2H21" />
        </svg>
      );
    case "bars":
      return (
        <svg className={className} {...common}>
          <path d="M4 20V13M11.5 20V4M19 20v-9" />
        </svg>
      );
    case "chart":
      return (
        <svg className={className} {...common}>
          <path d="M4 17l4.5-5 4 3 6-7.5" />
          <path d="M14 6.5h4.5V11" />
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

export default function AdminConsole() {
  const [tab, setTab] = useState<TabKey>("overview");
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      window.location.reload();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-30 border-b border-line-soft bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <LogoMark className="h-8 w-8" />
            <span className="hidden rounded-full border border-violet/30 bg-violet/10 px-2.5 py-1 text-[11px] font-medium text-violet sm:inline-flex">
              Admin
            </span>
          </div>
          <button
            onClick={logout}
            disabled={loggingOut}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-raised/40 px-3 text-[12.5px] text-ink-2 transition-colors hover:bg-raised disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M16 16l4-4-4-4M20 12H9" />
            </svg>
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <div className="mb-5 inline-flex flex-wrap gap-1 rounded-xl border border-line-soft bg-raised/30 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cx(
                "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                tab === t.key ? "bg-white/[0.10] text-ink" : "text-ink-3 hover:text-ink-2"
              )}
            >
              <TabIcon name={t.icon} className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <div>
          {tab === "overview" && <OverviewTab />}
          {tab === "users" && <UsersTab />}
          {tab === "deposits" && <DepositsTab />}
          {tab === "withdrawals" && <WithdrawalsTab />}
          {tab === "kyc" && <KycTab />}
          {tab === "activity" && <ActivityTab />}
          {tab === "desk" && <DeskTab />}
          {tab === "engine" && <EngineTab />}
          {tab === "signals" && <SignalTestingTab />}
        </div>
      </main>
    </div>
  );
}
