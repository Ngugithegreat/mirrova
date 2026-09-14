"use client";

import { Fragment, useEffect, useState } from "react";
import { fmtMoney } from "@/lib/format";

type KycSummary = { status: string; fullName: string; idNumberMasked: string } | null;
type KycDoc = { id: string; kind: string; blobPathname: string };

type UserRow = {
  id: string;
  name: string;
  email: string;
  cashCents: number;
  realCashCents: number;
  flagged: boolean;
  createdAt: string;
  accountType: string;
  totalDepositedUsdCents: number;
  activeCopyCount: number;
  realAllocation: { traderSlug: string; amountCents: number } | null;
  openDeskCount: number;
  kyc: KycSummary;
  kycDocuments: KycDoc[];
};

const TYPE_TONE: Record<string, string> = {
  standard: "border-line text-ink-2",
  ecn: "border-mint/30 bg-mint/10 text-mint",
  pro: "border-violet/40 bg-violet/10 text-violet",
  swapFree: "border-fuchsia/40 bg-fuchsia/10 text-fuchsia",
};
const TYPE_LABEL: Record<string, string> = { standard: "Standard", ecn: "ECN", pro: "Pro", swapFree: "Swap-Free" };

const KYC_TONE: Record<string, string> = {
  verified: "bg-pos/10 text-pos",
  pending: "bg-warn/10 text-warn",
  rejected: "bg-neg/10 text-neg",
  unsubmitted: "bg-raised/60 text-ink-3",
};

export default function UsersTab() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [q, setQ] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [bonusAmount, setBonusAmount] = useState("");
  const [bonusNote, setBonusNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

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

  function openDrawer(userId: string) {
    setOpenFor(openFor === userId ? null : userId);
    setBonusAmount("");
    setBonusNote("");
    setMsg(null);
  }

  async function submitBonus(userId: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/bonus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsd: Number(bonusAmount), note: bonusNote || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setBonusAmount("");
      setBonusNote("");
      setMsg({ kind: "ok", text: "Credited." });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  async function toggleFlag(userId: string, flagged: boolean) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagged }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setBusy(false);
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
                <th className="py-3 pr-4 font-medium">KYC</th>
                <th className="py-3 pr-4 font-medium">Real allocation</th>
                <th className="py-3 pr-4 text-right font-medium">Joined</th>
                <th className="py-3 text-right font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <Fragment key={u.id}>
                <tr className="border-b border-line-soft last:border-0">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2">
                      {u.flagged && (
                        <span title="Flagged" className="text-warn">
                          ⚑
                        </span>
                      )}
                      <div>
                        <div className="font-medium text-ink">{u.name}</div>
                        <div className="text-xs text-ink-3">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${TYPE_TONE[u.accountType] ?? ""}`}>
                      {TYPE_LABEL[u.accountType] ?? u.accountType}
                    </span>
                  </td>
                  <td className="tnum py-3.5 pr-4 text-ink-2">{fmtMoney(u.cashCents / 100)}</td>
                  <td className="tnum py-3.5 pr-4 text-ink-2">{fmtMoney(u.realCashCents / 100, 2)}</td>
                  <td className="tnum py-3.5 pr-4 text-ink-2">{fmtMoney(u.totalDepositedUsdCents / 100, 2)}</td>
                  <td className="py-3.5 pr-4">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${KYC_TONE[u.kyc?.status ?? "unsubmitted"]}`}>
                      {u.kyc?.status ?? "unsubmitted"}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4 text-ink-2">
                    {u.realAllocation ? (
                      <span className="tnum">
                        {u.realAllocation.traderSlug} · {fmtMoney(u.realAllocation.amountCents / 100, 2)}
                      </span>
                    ) : (
                      <span className="text-ink-3">—</span>
                    )}
                  </td>
                  <td className="py-3.5 pr-4 text-right text-xs text-ink-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => openDrawer(u.id)}
                      className="rounded-lg border border-line px-2.5 py-1 text-xs text-ink-2 transition-colors hover:border-mint/50 hover:text-mint"
                    >
                      {openFor === u.id ? "Close" : "Open"}
                    </button>
                  </td>
                </tr>
                {openFor === u.id && (
                  <tr className="border-b border-line-soft bg-raised/40 last:border-0">
                    <td colSpan={9} className="px-4 py-5">
                      <div className="grid gap-6 md:grid-cols-3">
                        <div>
                          <div className="text-xs font-medium uppercase tracking-wide text-ink-3">Identity</div>
                          {u.kyc ? (
                            <div className="mt-2 space-y-1 text-sm text-ink-2">
                              <div>{u.kyc.fullName}</div>
                              <div className="tnum text-ink-3">{u.kyc.idNumberMasked}</div>
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-ink-3">No KYC submission yet.</p>
                          )}
                          {u.kycDocuments.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {u.kycDocuments.map((doc) => (
                                <a
                                  key={doc.id}
                                  href={`/api/admin/kyc/doc?path=${encodeURIComponent(doc.blobPathname)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-lg border border-line px-2.5 py-1 text-xs capitalize text-ink-2 transition-colors hover:border-mint/50 hover:text-mint"
                                >
                                  {doc.kind.replace("_", " ")}
                                </a>
                              ))}
                            </div>
                          )}
                          {u.kyc?.status === "pending" && <p className="mt-2 text-xs text-ink-3">Review this submission in the KYC tab.</p>}
                          <button
                            onClick={() => toggleFlag(u.id, !u.flagged)}
                            disabled={busy}
                            className="mt-4 rounded-lg border border-line px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-warn/50 hover:text-warn disabled:opacity-50"
                          >
                            {u.flagged ? "Remove flag" : "Flag account"}
                          </button>
                        </div>

                        <div>
                          <div className="text-xs font-medium uppercase tracking-wide text-ink-3">Activity</div>
                          <div className="mt-2 space-y-1 text-sm text-ink-2">
                            <div>Active demo copies: <span className="tnum">{u.activeCopyCount}</span></div>
                            <div>Open Desk positions: <span className="tnum">{u.openDeskCount}</span></div>
                            <div>
                              Real allocation:{" "}
                              <span className="tnum">
                                {u.realAllocation ? `${u.realAllocation.traderSlug} · ${fmtMoney(u.realAllocation.amountCents / 100, 2)}` : "none"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium uppercase tracking-wide text-ink-3">Fund account (real balance)</div>
                          <div className="mt-2 flex flex-wrap items-end gap-2">
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={bonusAmount}
                              onChange={(e) => setBonusAmount(e.target.value)}
                              placeholder="50"
                              className="tnum w-24 rounded-lg border border-line bg-raised/60 px-3 py-2 text-sm text-ink focus:border-mint/50 focus:outline-none"
                            />
                            <input
                              value={bonusNote}
                              onChange={(e) => setBonusNote(e.target.value)}
                              placeholder="Note (optional)"
                              className="min-w-0 flex-1 rounded-lg border border-line bg-raised/60 px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-mint/50 focus:outline-none"
                            />
                            <button
                              onClick={() => submitBonus(u.id)}
                              disabled={busy || !bonusAmount || Number(bonusAmount) <= 0}
                              className="rounded-lg border border-mint/50 bg-mint/10 px-4 py-2 text-sm font-medium text-mint transition-colors disabled:opacity-50"
                            >
                              {busy ? "…" : "Credit"}
                            </button>
                          </div>
                          {msg && <p className={`mt-2 text-xs ${msg.kind === "ok" ? "text-mint" : "text-neg"}`}>{msg.text}</p>}
                        </div>
                      </div>
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
