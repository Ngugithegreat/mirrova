"use client";

import { useEffect, useState } from "react";
import { fmtMoney, cx } from "@/lib/format";

type Position = {
  id: string;
  traderName: string;
  instrument: string;
  side: "long" | "short";
  entryPrice: number;
  closePrice: number | null;
  copierCount: number;
  totalMirroredCents: number;
  openedAt: string;
  closedAt: string | null;
};

export default function EngineTab() {
  const [data, setData] = useState<{ open: Position[]; closed: Position[] } | null>(null);

  useEffect(() => {
    fetch("/api/admin/engine")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ open: [], closed: [] }));
  }, []);

  if (!data) return <div className="py-16 text-center text-ink-3">Loading…</div>;

  return (
    <div className="space-y-10">
      <p className="text-xs leading-relaxed text-ink-3">
        Illustrative only — read-only, ticks automatically on read (no manual controls). Never settled to any user&apos;s real balance.
      </p>

      <section>
        <h2 className="font-display text-lg font-semibold">Open positions ({data.open.length})</h2>
        {data.open.length === 0 ? (
          <div className="panel mt-4 p-8 text-center text-ink-2">No trader currently has an active real allocation.</div>
        ) : (
          <div className="scroll-x mt-4">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-3">
                  <th className="py-3 pr-4 font-medium">Trader</th>
                  <th className="py-3 pr-4 font-medium">Instrument</th>
                  <th className="py-3 pr-4 font-medium">Side</th>
                  <th className="py-3 pr-4 font-medium">Entry</th>
                  <th className="py-3 pr-4 font-medium">Copiers</th>
                  <th className="py-3 pr-4 font-medium">Mirrored</th>
                  <th className="py-3 text-right font-medium">Opened</th>
                </tr>
              </thead>
              <tbody>
                {data.open.map((p) => (
                  <tr key={p.id} className="border-b border-line-soft last:border-0">
                    <td className="py-3.5 pr-4 font-medium text-ink">{p.traderName}</td>
                    <td className="py-3.5 pr-4 text-ink-2">{p.instrument}</td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={cx(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase",
                          p.side === "long" ? "bg-pos/15 text-pos" : "bg-neg/15 text-neg"
                        )}
                      >
                        {p.side}
                      </span>
                    </td>
                    <td className="tnum py-3.5 pr-4 text-ink-2">{p.entryPrice}</td>
                    <td className="tnum py-3.5 pr-4 text-ink-2">{p.copierCount}</td>
                    <td className="tnum py-3.5 pr-4 text-ink-2">{fmtMoney(p.totalMirroredCents / 100)}</td>
                    <td className="py-3.5 text-right text-xs text-ink-3">{new Date(p.openedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Recently closed ({data.closed.length})</h2>
        {data.closed.length === 0 ? (
          <div className="panel mt-4 p-8 text-center text-ink-2">Nothing closed yet.</div>
        ) : (
          <div className="scroll-x mt-4">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-3">
                  <th className="py-3 pr-4 font-medium">Trader</th>
                  <th className="py-3 pr-4 font-medium">Instrument</th>
                  <th className="py-3 pr-4 font-medium">Side</th>
                  <th className="py-3 pr-4 font-medium">Entry → Close</th>
                  <th className="py-3 pr-4 font-medium">Copiers</th>
                  <th className="py-3 pr-4 font-medium">Mirrored</th>
                  <th className="py-3 text-right font-medium">Closed</th>
                </tr>
              </thead>
              <tbody>
                {data.closed.map((p) => (
                  <tr key={p.id} className="border-b border-line-soft last:border-0">
                    <td className="py-3.5 pr-4 font-medium text-ink">{p.traderName}</td>
                    <td className="py-3.5 pr-4 text-ink-2">{p.instrument}</td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={cx(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase",
                          p.side === "long" ? "bg-pos/15 text-pos" : "bg-neg/15 text-neg"
                        )}
                      >
                        {p.side}
                      </span>
                    </td>
                    <td className="tnum py-3.5 pr-4 text-ink-2">
                      {p.entryPrice} → {p.closePrice ?? "—"}
                    </td>
                    <td className="tnum py-3.5 pr-4 text-ink-2">{p.copierCount}</td>
                    <td className="tnum py-3.5 pr-4 text-ink-2">{fmtMoney(p.totalMirroredCents / 100)}</td>
                    <td className="py-3.5 text-right text-xs text-ink-3">{p.closedAt ? new Date(p.closedAt).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
