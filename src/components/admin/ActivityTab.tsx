"use client";

import { useEffect, useState } from "react";
import { fmtMoney } from "@/lib/format";

type UserRef = { id: string; name: string; email: string } | null;

type CopyRow = {
  id: string;
  amountCents: number;
  stopLossPct: number;
  startedAt: string;
  user: UserRef;
  traderName: string;
};

type AllocationRow = {
  id: string;
  amountCents: number;
  startedAt: string;
  user: UserRef;
  traderName: string;
};

export default function ActivityTab() {
  const [data, setData] = useState<{ copies: CopyRow[]; realAllocations: AllocationRow[] } | null>(null);

  useEffect(() => {
    fetch("/api/admin/activity")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ copies: [], realAllocations: [] }));
  }, []);

  if (!data) return <div className="py-16 text-center text-ink-3">Loading…</div>;

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-lg font-semibold">Active practice copies ({data.copies.length})</h2>
        {data.copies.length === 0 ? (
          <div className="panel mt-4 p-8 text-center text-ink-2">No active practice copies.</div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-raised/20">
            <div className="scroll-x">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-3">
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Trader</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Stop-loss</th>
                    <th className="px-4 py-3 text-right font-medium">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {data.copies.map((c) => (
                    <tr key={c.id} className="border-b border-line-soft last:border-0">
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-ink">{c.user?.name ?? "—"}</div>
                        <div className="text-xs text-ink-3">{c.user?.email ?? "unknown user"}</div>
                      </td>
                      <td className="px-4 py-3.5 text-ink-2">{c.traderName}</td>
                      <td className="tnum px-4 py-3.5 text-ink-2">{fmtMoney(c.amountCents / 100)}</td>
                      <td className="tnum px-4 py-3.5 text-ink-2">−{c.stopLossPct}%</td>
                      <td className="px-4 py-3.5 text-right text-xs text-ink-3">{new Date(c.startedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Active real allocations ({data.realAllocations.length})</h2>
        {data.realAllocations.length === 0 ? (
          <div className="panel mt-4 p-8 text-center text-ink-2">No active real allocations.</div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-raised/20">
            <div className="scroll-x">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-3">
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Trader</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 text-right font-medium">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {data.realAllocations.map((a) => (
                    <tr key={a.id} className="border-b border-line-soft last:border-0">
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-ink">{a.user?.name ?? "—"}</div>
                        <div className="text-xs text-ink-3">{a.user?.email ?? "unknown user"}</div>
                      </td>
                      <td className="px-4 py-3.5 text-ink-2">{a.traderName}</td>
                      <td className="tnum px-4 py-3.5 text-ink-2">{fmtMoney(a.amountCents / 100, 2)}</td>
                      <td className="px-4 py-3.5 text-right text-xs text-ink-3">{new Date(a.startedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
