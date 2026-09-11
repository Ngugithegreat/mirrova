"use client";

import { useState } from "react";
import Link from "next/link";
import { account, useAccountState } from "@/lib/accountClient";
import { realAccount, useRealAccountState } from "@/lib/realAccountClient";
import { ACCOUNT_TYPES } from "@/lib/accountTypes";
import { cx } from "@/lib/format";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel p-6">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

const KYC_LABEL: Record<string, string> = {
  unsubmitted: "Not started",
  pending: "Under review",
  verified: "Verified",
  rejected: "Rejected",
};
const KYC_TONE: Record<string, string> = {
  unsubmitted: "bg-ink-3/10 text-ink-3",
  pending: "bg-warn/10 text-warn",
  verified: "bg-mint/10 text-mint",
  rejected: "bg-neg/10 text-neg",
};

export default function Settings() {
  const state = useAccountState();
  const real = useRealAccountState();

  const [name, setName] = useState("");
  const [syncedEmail, setSyncedEmail] = useState<string | null>(null);
  const [nameBusy, setNameBusy] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [switchBusy, setSwitchBusy] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const [resetBusy, setResetBusy] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  // Adjusting local draft state when fresh data arrives — done during render
  // (React's documented pattern for this), not an effect, so a user's
  // in-progress edit is never overwritten by a spurious re-fetch.
  if (state.user && syncedEmail !== state.user.email) {
    setSyncedEmail(state.user.email);
    setName(state.user.name);
  }

  if (!state.ready || !state.user) {
    return <div className="mx-auto max-w-3xl px-5 py-24 text-center text-ink-3">Loading settings…</div>;
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameBusy(true);
    setNameMsg(null);
    try {
      await account.updateName(name);
      setNameMsg({ kind: "ok", text: "Name updated." });
    } catch (err) {
      setNameMsg({ kind: "err", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setNameBusy(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwBusy(true);
    setPwMsg(null);
    try {
      await account.changePassword(currentPw, newPw);
      setCurrentPw("");
      setNewPw("");
      setPwMsg({ kind: "ok", text: "Password changed." });
    } catch (err) {
      setPwMsg({ kind: "err", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setPwBusy(false);
    }
  }

  async function handleSwitchType(id: string) {
    setSwitchError(null);
    setSwitchBusy(id);
    try {
      await realAccount.switchType(id);
    } catch (err) {
      setSwitchError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSwitchBusy(null);
    }
  }

  async function toggleNotification(key: "notifyProductUpdates" | "notifySignalAlerts", value: boolean) {
    await account.updateNotificationPrefs({ [key]: value });
  }

  async function handleResetDemo() {
    if (!window.confirm("Reset your practice balance and stop every active demo copy? This can't be undone.")) return;
    setResetBusy(true);
    setResetMsg(null);
    try {
      await account.resetDemo();
      setResetMsg("Demo account reset.");
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 lg:px-8">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Settings</h1>

      <div className="mt-8 space-y-6">
        <Section title="Profile">
          <form onSubmit={saveName} className="space-y-4">
            <div>
              <label htmlFor="settings-name" className="text-xs font-medium uppercase tracking-wide text-ink-3">
                Full name
              </label>
              <input
                id="settings-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-line bg-raised/60 px-4 py-3 text-ink focus:border-mint/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-ink-3">Email</label>
              <div className="mt-2 w-full rounded-xl border border-line-soft bg-raised/30 px-4 py-3 text-ink-2">{state.user.email}</div>
            </div>
            {nameMsg && <p className={cx("text-sm", nameMsg.kind === "ok" ? "text-mint" : "text-neg")}>{nameMsg.text}</p>}
            <button
              type="submit"
              disabled={nameBusy}
              className="rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:border-mint/50 hover:text-mint disabled:opacity-50"
            >
              {nameBusy ? "Saving…" : "Save changes"}
            </button>
          </form>
        </Section>

        <Section title="Account type">
          <div className="flex flex-wrap items-center gap-2.5">
            {ACCOUNT_TYPES.map((t) => {
              const active = real.accountType?.id === t.id;
              const eligible = active || real.eligibleAccountTypes.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => !active && eligible && handleSwitchType(t.id)}
                  disabled={!eligible || switchBusy === t.id}
                  title={eligible ? undefined : `Deposit $${(t.minDepositUsdCents / 100).toLocaleString()} lifetime to unlock`}
                  className={cx(
                    "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-mint/50 bg-mint/10 text-mint"
                      : eligible
                        ? "border-line text-ink-2 hover:border-mint/50 hover:text-mint"
                        : "cursor-not-allowed border-line-soft text-ink-3 opacity-60"
                  )}
                >
                  {switchBusy === t.id ? "Switching…" : t.name}
                </button>
              );
            })}
          </div>
          {switchError && <p className="mt-3 text-sm text-neg">{switchError}</p>}
        </Section>

        <Section title="Identity verification">
          <div className="flex items-center justify-between">
            <span className={cx("rounded-full px-2.5 py-1 text-xs font-medium", KYC_TONE[real.kycStatus])}>{KYC_LABEL[real.kycStatus]}</span>
            {real.kycStatus !== "verified" && real.kycStatus !== "pending" && (
              <Link href="/verify" className="text-sm font-medium text-mint hover:underline">
                {real.kycStatus === "rejected" ? "Resubmit verification →" : "Start verification →"}
              </Link>
            )}
          </div>
        </Section>

        <Section title="Notifications">
          <div className="space-y-4">
            <label className="flex items-center justify-between gap-4">
              <span className="text-sm text-ink-2">Email me copy-signal alerts</span>
              <input
                type="checkbox"
                defaultChecked={state.notifySignalAlerts}
                onChange={(e) => toggleNotification("notifySignalAlerts", e.target.checked)}
                className="h-4 w-4 accent-[#22d3ee]"
              />
            </label>
            <label className="flex items-center justify-between gap-4">
              <span className="text-sm text-ink-2">Product updates &amp; announcements</span>
              <input
                type="checkbox"
                defaultChecked={state.notifyProductUpdates}
                onChange={(e) => toggleNotification("notifyProductUpdates", e.target.checked)}
                className="h-4 w-4 accent-[#22d3ee]"
              />
            </label>
          </div>
        </Section>

        <Section title="Security">
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label htmlFor="current-pw" className="text-xs font-medium uppercase tracking-wide text-ink-3">
                Current password
              </label>
              <input
                id="current-pw"
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="mt-2 w-full rounded-xl border border-line bg-raised/60 px-4 py-3 text-ink focus:border-mint/50 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="new-pw" className="text-xs font-medium uppercase tracking-wide text-ink-3">
                New password
              </label>
              <input
                id="new-pw"
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="At least 8 characters"
                className="mt-2 w-full rounded-xl border border-line bg-raised/60 px-4 py-3 text-ink placeholder:text-ink-3 focus:border-mint/50 focus:outline-none"
              />
            </div>
            {pwMsg && <p className={cx("text-sm", pwMsg.kind === "ok" ? "text-mint" : "text-neg")}>{pwMsg.text}</p>}
            <button
              type="submit"
              disabled={pwBusy}
              className="rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:border-mint/50 hover:text-mint disabled:opacity-50"
            >
              {pwBusy ? "Changing…" : "Change password"}
            </button>
          </form>
        </Section>

        <Section title="Two-factor authentication">
          <div className="flex items-center justify-between gap-4 opacity-60">
            <span className="text-sm text-ink-2">Add an extra layer of security to your account.</span>
            <span className="rounded-full border border-line px-3 py-1 text-xs text-ink-3">Coming soon</span>
          </div>
        </Section>

        <Section title="Danger zone">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink">Reset demo account</p>
                <p className="text-xs text-ink-3">Stops every active demo copy and restores your practice balance.</p>
              </div>
              <button
                onClick={handleResetDemo}
                disabled={resetBusy}
                className="rounded-lg border border-warn/40 px-3.5 py-2 text-xs font-medium text-warn transition-colors hover:bg-warn/10 disabled:opacity-50"
              >
                {resetBusy ? "Resetting…" : "Reset"}
              </button>
            </div>
            {resetMsg && <p className="text-sm text-mint">{resetMsg}</p>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-4">
              <div>
                <p className="text-sm font-medium text-ink">Close account</p>
                <p className="text-xs text-ink-3">Contact support to permanently close your account.</p>
              </div>
              <a
                href="mailto:support@asporttraders.com"
                className="rounded-lg border border-line px-3.5 py-2 text-xs font-medium text-ink-2 transition-colors hover:border-neg/50 hover:text-neg"
              >
                Contact support
              </a>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
