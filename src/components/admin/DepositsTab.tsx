"use client";

import { useEffect, useState } from "react";
import { fmtMoney, cx } from "@/lib/format";

type Deposit = {
  id: string;
  method: "mpesa" | "crypto";
  status: "pending" | "completed" | "failed";
  displayAmount: string;
  creditedUsdCents: number | null;
  detail: string;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
};

type Totals = { status: string; totalUsdCents: number; count: number };

const STATUS_TONE: Record<string, string> = {
  completed: "bg-pos/10 text-pos",
  pending: "bg-warn/10 text-warn",
  failed: "bg-neg/10 text-neg",
};

const FILTERS = ["all", "pending", "completed", "failed"] as const;

export default function DepositsTab() {
  const [deposits, setDeposits] = useState<Deposit[] | null>(null);
  const [totals, setTotals] = useState<Totals[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    const url = filter === "all" ? "/api/admin/deposits" : `/api/admin/deposits?status=${filter}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setDeposits(d.deposits ?? []);
        setTotals(d.totals ?? []);
      })
      .catch(() => setDeposits([]));
  }

  useEffect(load, [filter]);

  async function reconcile(method: "mpesa" | "crypto", detail: string) {
    setBusyId(detail);
    setError(null);
    try {
      const res = await fetch("/api/admin/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, detail }),
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

      {!deposits ? (
        <div className="py-16 text-center text-ink-3">Loading…</div>
      ) : deposits.length === 0 ? (
        <div className="panel mt-4 p-10 text-center text-ink-2">No deposits found.</div>
      ) : (
        <div className="scroll-x mt-4">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-3">
                <th className="py-3 pr-4 font-medium">User</th>
                <th className="py-3 pr-4 font-medium">Method</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 pr-4 font-medium">Amount</th>
                <th className="py-3 pr-4 font-medium">Credited USD</th>
                <th className="py-3 pr-4 font-medium">Reference</th>
                <th className="py-3 pr-4 font-medium">Created</th>
                <th className="py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((d) => (
                <tr key={d.id} className="border-b border-line-soft last:border-0">
                  <td className="py-3.5 pr-4">
                    <div className="font-medium text-ink">{d.user?.name ?? "—"}</div>
                    <div className="text-xs text-ink-3">{d.user?.email ?? "unknown user"}</div>
                  </td>
                  <td className="py-3.5 pr-4 text-ink-2 capitalize">{d.method}</td>
                  <td className="py-3.5 pr-4">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${STATUS_TONE[d.status]}`}>{d.status}</span>
                  </td>
                  <td className="tnum py-3.5 pr-4 text-ink-2">{d.displayAmount}</td>
                  <td className="tnum py-3.5 pr-4 text-ink-2">{d.creditedUsdCents != null ? fmtMoney(d.creditedUsdCents / 100, 2) : "—"}</td>
                  <td className="max-w-[220px] truncate py-3.5 pr-4 text-xs text-ink-3" title={d.detail}>
                    {d.detail}
                  </td>
                  <td className="py-3.5 pr-4 text-xs text-ink-3">{new Date(d.createdAt).toLocaleString()}</td>
                  <td className="py-3.5 text-right">
                    {d.status === "pending" && (
                      <button
                        onClick={() => reconcile(d.method, d.detail)}
                        disabled={busyId === d.detail}
                        className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-mint/50 hover:text-mint disabled:opacity-50"
                      >
                        {busyId === d.detail ? "Checking…" : "Reconcile"}
                      </button>
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
