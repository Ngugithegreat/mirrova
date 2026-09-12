"use client";

import { Fragment, useEffect, useState } from "react";
import { fmtMoney } from "@/lib/format";

type UserRow = {
  id: string;
  name: string;
  email: string;
  cashCents: number;
  realCashCents: number;
  createdAt: string;
  accountType: string;
  totalDepositedUsdCents: number;
  activeCopyCount: number;
  realAllocation: { traderSlug: string; amountCents: number } | null;
  openDeskCount: number;
};

const TYPE_TONE: Record<string, string> = {
  standard: "border-line text-ink-2",
  ecn: "border-mint/30 bg-mint/10 text-mint",
  pro: "border-violet/40 bg-violet/10 text-violet",
  swapFree: "border-fuchsia/40 bg-fuchsia/10 text-fuchsia",
};

const TYPE_LABEL: Record<string, string> = { standard: "Standard", ecn: "ECN", pro: "Pro", swapFree: "Swap-Free" };

export default function UsersTab() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [q, setQ] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [bonusOpenFor, setBonusOpenFor] = useState<string | null>(null);
  const [bonusAmount, setBonusAmount] = useState("");
  const [bonusNote, setBonusNote] = useState("");
  const [bonusBusy, setBonusBusy] = useState(false);
  const [bonusMsg, setBonusMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      const url = q ? `/api/admin/users?q=${encodeURIComponent(q)}` : "/api/admin/users";
      fetch(url)
        .then((r) => r.json())
        .then((d) => setUsers(d.users ?? []))
        .catch(() => setUsers([]));
    }, 250);
    return () => clearTimeout(id);
  }, [q, refreshKey]);

  function openBonus(userId: string) {
    setBonusOpenFor(userId);
    setBonusAmount("");
    setBonusNote("");
    setBonusMsg(null);
  }

  async function submitBonus(userId: string) {
    setBonusBusy(true);
    setBonusMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/bonus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsd: Number(bonusAmount), note: bonusNote || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setBonusOpenFor(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setBonusMsg({ kind: "err", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setBonusBusy(false);
    }
  }

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search name or email…"
        className="w-full max-w-xs rounded-xl border border-line bg-raised/60 px-4 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-mint/50 focus:outline-none"
      />

      {!users ? (
        <div className="py-16 text-center text-ink-3">Loading…</div>
      ) : users.length === 0 ? (
        <div className="panel mt-4 p-10 text-center text-ink-2">No users found.</div>
      ) : (
        <div className="scroll-x mt-4">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-3">
                <th className="py-3 pr-4 font-medium">User</th>
                <th className="py-3 pr-4 font-medium">Account type</th>
                <th className="py-3 pr-4 font-medium">Practice cash</th>
                <th className="py-3 pr-4 font-medium">Real cash</th>
                <th className="py-3 pr-4 font-medium">Deposited</th>
                <th className="py-3 pr-4 font-medium">Copies</th>
                <th className="py-3 pr-4 font-medium">Real allocation</th>
                <th className="py-3 pr-4 font-medium">Desk</th>
                <th className="py-3 pr-4 text-right font-medium">Joined</th>
                <th className="py-3 text-right font-medium">Bonus</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <Fragment key={u.id}>
                <tr className="border-b border-line-soft last:border-0">
                  <td className="py-3.5 pr-4">
                    <div className="font-medium text-ink">{u.name}</div>
                    <div className="text-xs text-ink-3">{u.email}</div>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${TYPE_TONE[u.accountType] ?? ""}`}>
                      {TYPE_LABEL[u.accountType] ?? u.accountType}
                    </span>
                  </td>
                  <td className="tnum py-3.5 pr-4 text-ink-2">{fmtMoney(u.cashCents / 100)}</td>
                  <td className="tnum py-3.5 pr-4 text-ink-2">{fmtMoney(u.realCashCents / 100, 2)}</td>
                  <td className="tnum py-3.5 pr-4 text-ink-2">{fmtMoney(u.totalDepositedUsdCents / 100, 2)}</td>
                  <td className="tnum py-3.5 pr-4 text-ink-2">{u.activeCopyCount}</td>
                  <td className="py-3.5 pr-4 text-ink-2">
                    {u.realAllocation ? (
                      <span className="tnum">
                        {u.realAllocation.traderSlug} · {fmtMoney(u.realAllocation.amountCents / 100, 2)}
                      </span>
                    ) : (
                      <span className="text-ink-3">—</span>
                    )}
                  </td>
                  <td className="tnum py-3.5 pr-4 text-ink-2">{u.openDeskCount}</td>
                  <td className="py-3.5 pr-4 text-right text-xs text-ink-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => (bonusOpenFor === u.id ? setBonusOpenFor(null) : openBonus(u.id))}
                      className="rounded-lg border border-line px-2.5 py-1 text-xs text-ink-2 transition-colors hover:border-mint/50 hover:text-mint"
                    >
                      {bonusOpenFor === u.id ? "Cancel" : "Grant bonus"}
                    </button>
                  </td>
                </tr>
                {bonusOpenFor === u.id && (
                  <tr className="border-b border-line-soft bg-raised/40 last:border-0">
                    <td colSpan={10} className="px-4 py-4">
                      <div className="flex flex-wrap items-end gap-3">
                        <div>
                          <label className="text-xs font-medium uppercase tracking-wide text-ink-3">Amount (USD)</label>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={bonusAmount}
                            onChange={(e) => setBonusAmount(e.target.value)}
                            placeholder="50"
                            className="tnum mt-1.5 w-32 rounded-lg border border-line bg-raised/60 px-3 py-2 text-sm text-ink focus:border-mint/50 focus:outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-medium uppercase tracking-wide text-ink-3">Note (optional)</label>
                          <input
                            value={bonusNote}
                            onChange={(e) => setBonusNote(e.target.value)}
                            placeholder="e.g. loyalty bonus"
                            className="mt-1.5 w-full rounded-lg border border-line bg-raised/60 px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-mint/50 focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={() => submitBonus(u.id)}
                          disabled={bonusBusy || !bonusAmount || Number(bonusAmount) <= 0}
                          className="rounded-lg border border-mint/50 bg-mint/10 px-4 py-2 text-sm font-medium text-mint transition-colors disabled:opacity-50"
                        >
                          {bonusBusy ? "Granting…" : "Confirm grant"}
                        </button>
                      </div>
                      {bonusMsg && <p className={`mt-2 text-xs ${bonusMsg.kind === "ok" ? "text-mint" : "text-neg"}`}>{bonusMsg.text}</p>}
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
