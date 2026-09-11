"use client";

import { useEffect, useState } from "react";
import { fmtMoney, fmtCount } from "@/lib/format";

type Overview = {
  totalUsers: number;
  totalDepositedUsdCents: number;
  totalPracticeCashCents: number;
  activeCopiesCount: number;
  activeAllocationsCount: number;
  activeAllocationsTotalCents: number;
  openDeskCount: number;
  tierCounts: { core: number; momentum: number; apex: number };
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-5">
      <div className="text-[11px] uppercase tracking-wide text-ink-3">{label}</div>
      <div className="tnum mt-1.5 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}

export default function OverviewTab() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return <div className="py-16 text-center text-ink-3">Loading…</div>;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total users" value={fmtCount(data.totalUsers)} />
        <Stat label="Lifetime deposits" value={fmtMoney(data.totalDepositedUsdCents / 100)} />
        <Stat label="Practice cash outstanding" value={fmtMoney(data.totalPracticeCashCents / 100)} />
        <Stat label="Active practice copies" value={fmtCount(data.activeCopiesCount)} />
        <Stat
          label="Active real allocations"
          value={`${fmtCount(data.activeAllocationsCount)} · ${fmtMoney(data.activeAllocationsTotalCents / 100)}`}
        />
        <Stat label="Open Desk positions" value={fmtCount(data.openDeskCount)} />
      </div>

      <div className="panel mt-6 p-6">
        <h2 className="font-display text-base font-semibold">Users by tier</h2>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="tnum text-xl font-semibold text-ink">{data.tierCounts.core}</div>
            <div className="mt-1 text-xs text-ink-3">Core</div>
          </div>
          <div>
            <div className="tnum text-xl font-semibold text-ink">{data.tierCounts.momentum}</div>
            <div className="mt-1 text-xs text-ink-3">Momentum</div>
          </div>
          <div>
            <div className="tnum text-xl font-semibold text-ink">{data.tierCounts.apex}</div>
            <div className="mt-1 text-xs text-ink-3">Apex</div>
          </div>
        </div>
      </div>
    </div>
  );
}
