"use client";

import { useEffect, useState } from "react";
import { fmtMoney, cx } from "@/lib/format";

type Withdrawal = {
  id: string;
  status: "pending" | "paid" | "rejected";
  amountUsdCents: number;
  phone: string;
  note: string | null;
  requestedAt: string;
  user: { id: string; name: string; email: string } | null;
};

type Totals = { status: string; totalUsdCents: number; count: number };

const STATUS_TONE: Record<string, string> = {
  paid: "bg-pos/10 text-pos",
  pending: "bg-warn/10 text-warn",
  rejected: "bg-neg/10 text-neg",
};

const FILTERS = ["all", "pending", "paid", "rejected"] as const;

export default function WithdrawalsTab() {
  const [rows, setRows] = useState<Withdrawal[] | null>(null);
  const [totals, setTotals] = useState<Totals[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    const url = filter === "all" ? "/api/admin/withdrawals" : `/api/admin/withdrawals?status=${filter}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setRows(d.withdrawals ?? []);
        setTotals(d.totals ?? []);
      })
      .catch(() => setRows([]));
  }

  useEffect(load, [filter]);

  async function resolve(id: string, action: "pay" | "reject") {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cx(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition-colors",
                filter === f ? "border-mint/50 bg-mint/10 text-mint" : "border-line text-ink-2 hover:text-ink"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-4 text-xs text-ink-3">
          {totals.map((t) => (
            <span key={t.status}>
              <span className="capitalize">{t.status}</span>: <span className="tnum text-ink-2">{t.count}</span> ·{" "}
              <span className="tnum text-ink-2">{fmtMoney(t.totalUsdCents / 100, 2)}</span>
            </span>
          ))}
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-neg">{error}</p>}

      {!rows ? (
        <div className="py-16 text-center text-ink-3">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="panel mt-4 p-10 text-center text-ink-2">No withdrawals found.</div>
      ) : (
        <div className="scroll-x mt-4">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-3">
                <th className="py-3 pr-4 font-medium">User</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 pr-4 font-medium">Amount</th>
                <th className="py-3 pr-4 font-medium">Phone</th>
                <th className="py-3 pr-4 font-medium">Requested</th>
                <th className="py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.id} className="border-b border-line-soft last:border-0">
                  <td className="py-3.5 pr-4">
                    <div className="font-medium text-ink">{w.user?.name ?? "—"}</div>
                    <div className="text-xs text-ink-3">{w.user?.email ?? "unknown user"}</div>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className={cx("rounded-md px-2 py-0.5 text-xs font-medium capitalize", STATUS_TONE[w.status])}>{w.status}</span>
                  </td>
                  <td className="tnum py-3.5 pr-4 text-ink-2">{fmtMoney(w.amountUsdCents / 100, 2)}</td>
                  <td className="tnum py-3.5 pr-4 text-ink-2">{w.phone}</td>
                  <td className="py-3.5 pr-4 text-xs text-ink-3">{new Date(w.requestedAt).toLocaleString()}</td>
                  <td className="py-3.5 text-right">
                    {w.status === "pending" && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => resolve(w.id, "pay")}
                          disabled={busyId === w.id}
                          className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-mint/50 hover:text-mint disabled:opacity-50"
                        >
                          {busyId === w.id ? "…" : "Mark paid"}
                        </button>
                        <button
                          onClick={() => resolve(w.id, "reject")}
                          disabled={busyId === w.id}
                          className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-neg/50 hover:text-neg disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
