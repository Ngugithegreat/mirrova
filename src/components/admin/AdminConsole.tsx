"use client";

import { useState } from "react";
import { cx } from "@/lib/format";
import OverviewTab from "./OverviewTab";
import UsersTab from "./UsersTab";
import DepositsTab from "./DepositsTab";
import WithdrawalsTab from "./WithdrawalsTab";
import ActivityTab from "./ActivityTab";
import DeskTab from "./DeskTab";
import KycTab from "./KycTab";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "users", label: "Users" },
  { key: "deposits", label: "Deposits" },
  { key: "withdrawals", label: "Withdrawals" },
  { key: "kyc", label: "KYC" },
  { key: "activity", label: "Copy activity" },
  { key: "desk", label: "Desk" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

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
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Admin</h1>
        <button
          onClick={logout}
          disabled={loggingOut}
          className="rounded-lg border border-line px-3.5 py-2 text-xs text-ink-2 transition-colors hover:border-neg/50 hover:text-neg disabled:opacity-50"
        >
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2 border-b border-line-soft pb-4" aria-label="Admin sections">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cx(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t.key ? "border-mint/50 bg-mint/10 text-mint" : "border-line text-ink-2 hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="mt-8">
        {tab === "overview" && <OverviewTab />}
        {tab === "users" && <UsersTab />}
        {tab === "deposits" && <DepositsTab />}
        {tab === "withdrawals" && <WithdrawalsTab />}
        {tab === "kyc" && <KycTab />}
        {tab === "activity" && <ActivityTab />}
        {tab === "desk" && <DeskTab />}
      </div>
    </div>
  );
}
