"use client";

import { useEffect, useState } from "react";
import { fmtMoney } from "@/lib/format";

type UserRow = {
  id: string;
  name: string;
  email: string;
  cashCents: number;
  realCashCents: number;
  createdAt: string;
  tier: string;
  totalDepositedUsdCents: number;
  activeCopyCount: number;
  realAllocation: { traderSlug: string; amountCents: number } | null;
  openDeskCount: number;
};

const TIER_TONE: Record<string, string> = {
  core: "border-line text-ink-2",
  momentum: "border-mint/30 bg-mint/10 text-mint",
  apex: "border-violet/40 bg-violet/10 text-violet",
};

export default function UsersTab() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    const id = setTimeout(() => {
      const url = q ? `/api/admin/users?q=${encodeURIComponent(q)}` : "/api/admin/users";
      fetch(url)
        .then((r) => r.json())
        .then((d) => setUsers(d.users ?? []))
        .catch(() => setUsers([]));
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

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
                <th className="py-3 pr-4 font-medium">Tier</th>
                <th className="py-3 pr-4 font-medium">Practice cash</th>
                <th className="py-3 pr-4 font-medium">Real cash</th>
                <th className="py-3 pr-4 font-medium">Deposited</th>
                <th className="py-3 pr-4 font-medium">Copies</th>
                <th className="py-3 pr-4 font-medium">Real allocation</th>
                <th className="py-3 pr-4 font-medium">Desk</th>
                <th className="py-3 text-right font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line-soft last:border-0">
                  <td className="py-3.5 pr-4">
                    <div className="font-medium text-ink">{u.name}</div>
                    <div className="text-xs text-ink-3">{u.email}</div>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${TIER_TONE[u.tier] ?? ""}`}>
                      {u.tier}
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
                  <td className="py-3.5 text-right text-xs text-ink-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
