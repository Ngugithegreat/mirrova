"use client";

import { useEffect, useMemo, useState } from "react";
import TraderAvatar from "@/components/ui/TraderAvatar";
import { fmtMoney, cx } from "@/lib/format";

type KycSummary = {
  status: "unsubmitted" | "pending" | "verified" | "rejected";
  fullName: string;
  idType: string;
  idNumberMasked: string;
  dateOfBirth: string;
  address: string;
  submittedAt: string | null;
  reviewNote: string | null;
} | null;
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

const STATUS_META: Record<string, { label: string; tone: string; banner: string }> = {
  verified: { label: "Verified", tone: "bg-pos/10 text-pos", banner: "border-pos/25 bg-pos/[0.06]" },
  pending: { label: "Under review", tone: "bg-warn/10 text-warn", banner: "border-warn/25 bg-warn/[0.06]" },
  rejected: { label: "Rejected", tone: "bg-neg/10 text-neg", banner: "border-neg/25 bg-neg/[0.06]" },
  unsubmitted: { label: "Not started", tone: "bg-raised/60 text-ink-3", banner: "border-line bg-white/[0.02]" },
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "verified", label: "Verified" },
  { id: "rejected", label: "Rejected" },
  { id: "unsubmitted", label: "Not started" },
] as const;

const DOC_LABEL: Record<string, string> = { id_front: "ID — front", id_back: "ID — back", selfie: "Selfie with ID" };

export default function UsersTab() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      const url = query ? `/api/admin/users?q=${encodeURIComponent(query)}` : "/api/admin/users";
      fetch(url)
        .then((r) => r.json())
        .then((d) => setUsers(d.users ?? []))
        .catch(() => setUsers([]));
    }, 250);
    return () => clearTimeout(id);
  }, [query, refreshKey]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { total: users?.length ?? 0, pending: 0, verified: 0, rejected: 0, unsubmitted: 0 };
    for (const u of users ?? []) c[u.kyc?.status ?? "unsubmitted"] = (c[u.kyc?.status ?? "unsubmitted"] ?? 0) + 1;
    return c;
  }, [users]);

  const results = useMemo(() => {
    if (!users) return [];
    if (filter === "all") return users;
    return users.filter((u) => (u.kyc?.status ?? "unsubmitted") === filter);
  }, [users, filter]);

  const selected = users?.find((u) => u.id === selectedId) ?? null;

  const STATS = [
    { label: "Total users", value: counts.total, tone: "text-ink" },
    { label: "Pending review", value: counts.pending, tone: "text-warn" },
    { label: "Verified", value: counts.verified, tone: "text-pos" },
    { label: "Rejected", value: counts.rejected, tone: "text-neg" },
  ];

  return (
    <div>
      <p className="text-[14px] text-ink-3">Every registered account with live figures. Review identity submissions here.</p>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="panel rounded-2xl p-4">
            <span className="text-[12px] text-ink-3">{s.label}</span>
            <p className={cx("tnum mt-2 font-display text-[26px] font-bold", s.tone)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs sm:flex-1">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email…"
            className="w-full rounded-xl border border-line bg-raised/60 py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-3 focus:border-mint/50 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cx(
                "rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                filter === f.id ? "bg-white/[0.10] text-ink" : "text-ink-3 hover:bg-raised/40 hover:text-ink-2"
              )}
            >
              {f.label}
              {f.id !== "all" && <span className="tnum ml-1.5 text-ink-3">{counts[f.id] ?? 0}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-raised/20">
        {!users ? (
          <div className="py-16 text-center text-ink-3">Loading…</div>
        ) : (
          <div className="scroll-x">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink-3">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Account type</th>
                  <th className="px-4 py-3 text-right font-medium">Practice cash</th>
                  <th className="px-4 py-3 text-right font-medium">Real cash</th>
                  <th className="px-4 py-3 text-right font-medium">Deposited</th>
                  <th className="px-4 py-3 font-medium">KYC</th>
                  <th className="px-4 py-3 text-right font-medium">Joined</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((u) => {
                  const meta = STATUS_META[u.kyc?.status ?? "unsubmitted"];
                  return (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedId(u.id)}
                      className="cursor-pointer border-b border-line-soft transition-colors last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <TraderAvatar name={u.name} size="sm" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-[13.5px] font-medium text-ink">{u.name}</p>
                              {u.flagged && <span title="Flagged" className="text-warn">⚑</span>}
                            </div>
                            <p className="truncate text-[12px] text-ink-3">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${TYPE_TONE[u.accountType] ?? ""}`}>
                          {TYPE_LABEL[u.accountType] ?? u.accountType}
                        </span>
                      </td>
                      <td className="tnum px-4 py-3 text-right text-[13px] text-ink-2">{fmtMoney(u.cashCents / 100)}</td>
                      <td className="tnum px-4 py-3 text-right text-[13px] font-semibold text-ink">{fmtMoney(u.realCashCents / 100, 2)}</td>
                      <td className="tnum px-4 py-3 text-right text-[13px] text-ink-3">{fmtMoney(u.totalDepositedUsdCents / 100, 2)}</td>
                      <td className="px-4 py-3">
                        <span className={cx("rounded-md px-2 py-0.5 text-xs font-medium", meta.tone)}>{meta.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-[12.5px] text-ink-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right"><span className="text-[12.5px] font-medium text-mint">View →</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {results.length === 0 && <div className="px-4 py-14 text-center text-[14px] text-ink-3">No users match those filters.</div>}
          </div>
        )}
      </div>
      {users && <p className="mt-3 text-[12px] text-ink-3">Showing {results.length} of {users.length} accounts.</p>}

      <UserDrawer user={selected} onClose={() => setSelectedId(null)} onChanged={() => setRefreshKey((k) => k + 1)} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Detail drawer                                                              */
/* -------------------------------------------------------------------------- */

const REJECT_REASONS = [
  "ID photo blurred — details not legible.",
  "Selfie does not match the ID document.",
  "Document appears to be expired.",
  "Submitted details don't match the account name.",
];

function UserDrawer({ user, onClose, onChanged }: { user: UserRow | null; onClose: () => void; onChanged: () => void }) {
  const open = user !== null;
  return (
    <>
      <div
        onClick={onClose}
        className={cx(
          "fixed inset-0 z-50 bg-bg/70 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        className={cx(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-line bg-surface transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Keyed by user.id so switching users remounts fresh local state
            (rejecting/fund inputs) instead of needing a reset effect. */}
        {user && <DrawerBody key={user.id} user={user} onClose={onClose} onChanged={onChanged} />}
      </aside>
    </>
  );
}

function DrawerBody({ user, onClose, onChanged }: { user: UserRow; onClose: () => void; onChanged: () => void }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [busy, setBusy] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [fundNote, setFundNote] = useState("");
  const [fundBusy, setFundBusy] = useState(false);
  const [fundMsg, setFundMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const meta = STATUS_META[user.kyc?.status ?? "unsubmitted"];
  const canReview = user.kyc?.status === "pending";

  async function fund() {
    const amount = Number(fundAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFundMsg({ tone: "err", text: "Enter a valid amount." });
      return;
    }
    setFundBusy(true);
    setFundMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/bonus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsd: amount, note: fundNote.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Funding failed.");
      setFundMsg({ tone: "ok", text: `Credited ${fmtMoney(amount)} to ${user.name.split(" ")[0]}.` });
      setFundAmount("");
      setFundNote("");
      onChanged();
    } catch (err) {
      setFundMsg({ tone: "err", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setFundBusy(false);
    }
  }

  async function review(decision: "verified" | "rejected") {
    setBusy(true);
    try {
      await fetch("/api/admin/kyc/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, decision, note: decision === "rejected" ? reason : undefined }),
      });
      onChanged();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function toggleFlag() {
    await fetch(`/api/admin/users/${user.id}/flag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flagged: !user.flagged }),
    });
    onChanged();
  }

  return (
    <>
            <div className="flex items-start justify-between gap-4 border-b border-line-soft p-5">
              <div className="flex items-center gap-3">
                <TraderAvatar name={user.name} size="lg" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[17px] font-semibold text-ink">{user.name}</h2>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${TYPE_TONE[user.accountType] ?? ""}`}>
                      {TYPE_LABEL[user.accountType] ?? user.accountType}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-ink-3">{user.email}</p>
                </div>
              </div>
              <button onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-3 hover:bg-white/[0.07] hover:text-ink">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className={cx("flex items-center justify-between rounded-xl border p-3.5", meta?.banner)}>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.1em] text-ink-3">KYC status</p>
                  <div className="mt-1"><span className={cx("rounded-md px-2 py-0.5 text-xs font-medium", meta?.tone)}>{meta?.label}</span></div>
                </div>
                {user.kyc?.submittedAt && <p className="text-right text-[11.5px] text-ink-3">Submitted {new Date(user.kyc.submittedAt).toLocaleString()}</p>}
              </div>

              <Section title="Contact">
                <Row label="Email" value={user.email} />
                <Row label="Joined" value={new Date(user.createdAt).toLocaleString()} />
              </Section>

              <Section title="Account">
                <div className="grid grid-cols-2 gap-2">
                  <Metric label="Practice cash" value={fmtMoney(user.cashCents / 100)} />
                  <Metric label="Real cash" value={fmtMoney(user.realCashCents / 100, 2)} />
                  <Metric label="Deposited" value={fmtMoney(user.totalDepositedUsdCents / 100, 2)} />
                  <Metric label="Active demo copies" value={String(user.activeCopyCount)} />
                  <Metric
                    label="Real allocation"
                    value={user.realAllocation ? `${user.realAllocation.traderSlug} · ${fmtMoney(user.realAllocation.amountCents / 100, 2)}` : "none"}
                  />
                  <Metric label="Open Desk positions" value={String(user.openDeskCount)} />
                </div>
              </Section>

              <Section title="Fund account">
                <p className="text-[12px] leading-relaxed text-ink-3">
                  Manually credit {user.name.split(" ")[0]}&rsquo;s real balance — use this when a real payment didn&rsquo;t reflect.
                </p>
                <div className="mt-3 flex gap-2">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-ink-3">$</span>
                    <input
                      type="number"
                      min={0}
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      placeholder="Amount (USD)"
                      disabled={fundBusy}
                      className="tnum w-full rounded-lg border border-line bg-raised/60 py-2 pl-6 pr-3 text-sm text-ink focus:border-mint/50 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  <button
                    onClick={fund}
                    disabled={fundBusy}
                    className="shrink-0 rounded-lg border border-mint/50 bg-mint/10 px-4 py-2 text-sm font-medium text-mint transition-colors disabled:opacity-50"
                  >
                    {fundBusy ? "…" : "Fund"}
                  </button>
                </div>
                <input
                  value={fundNote}
                  onChange={(e) => setFundNote(e.target.value)}
                  placeholder="Note (optional) — e.g. M-Pesa reference"
                  disabled={fundBusy}
                  className="mt-2 w-full rounded-lg border border-line bg-raised/60 px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-mint/50 focus:outline-none disabled:opacity-50"
                />
                {fundMsg && <p className={cx("mt-2 text-[12.5px]", fundMsg.tone === "ok" ? "text-mint" : "text-neg")}>{fundMsg.text}</p>}
              </Section>

              {user.kyc ? (
                <>
                  <Section title="Identity details">
                    <Row label="Document type" value={user.kyc.idType} />
                    <Row label="Document number" value={user.kyc.idNumberMasked} mono />
                    <Row label="Date of birth" value={user.kyc.dateOfBirth} />
                    <Row label="Address" value={user.kyc.address} />
                    {user.kyc.reviewNote && <Row label="Review note" value={user.kyc.reviewNote} />}
                  </Section>
                  <Section title={`Documents (${user.kycDocuments.length})`}>
                    {user.kycDocuments.length === 0 ? (
                      <p className="text-[13px] text-ink-3">No documents uploaded.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5">
                        {user.kycDocuments.map((doc) => {
                          const url = `/api/admin/kyc/doc?path=${encodeURIComponent(doc.blobPathname)}`;
                          return (
                            <a
                              key={doc.id}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="group block overflow-hidden rounded-xl border border-line bg-white/[0.02] transition-colors hover:border-mint/40"
                            >
                              <div className="relative grid aspect-[4/3] place-items-center bg-black/30">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={DOC_LABEL[doc.kind] ?? doc.kind} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                                <span className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                                  Open ↗
                                </span>
                              </div>
                              <div className="p-2.5">
                                <p className="text-[12px] font-medium text-ink">{DOC_LABEL[doc.kind] ?? doc.kind}</p>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </Section>
                </>
              ) : (
                <div className="mt-5 rounded-xl border border-line bg-white/[0.02] p-4 text-center">
                  <p className="text-[13px] text-ink-3">This user has not submitted identity documents yet.</p>
                </div>
              )}
            </div>

            <div className="border-t border-line-soft p-4">
              {rejecting ? (
                <div className="space-y-3">
                  <p className="text-[13px] font-medium text-ink">Reason for rejection</p>
                  <div className="space-y-1.5">
                    {REJECT_REASONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => setReason(r)}
                        className={cx(
                          "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-[12.5px] transition-colors",
                          reason === r ? "border-neg/40 bg-neg/[0.08] text-ink" : "border-line text-ink-3 hover:bg-white/[0.04]"
                        )}
                      >
                        <span className={cx("grid h-4 w-4 shrink-0 place-items-center rounded-full border", reason === r ? "border-neg bg-neg" : "border-line")}>
                          {reason === r && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </span>
                        {r}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setRejecting(false)} className="flex-1 rounded-lg border border-line py-2 text-sm text-ink-2 transition-colors hover:bg-white/[0.04]">
                      Cancel
                    </button>
                    <button
                      onClick={() => review("rejected")}
                      disabled={busy}
                      className="flex-1 rounded-lg border border-neg/50 bg-neg/10 py-2 text-sm font-medium text-neg transition-colors disabled:opacity-50"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleFlag}
                    title={user.flagged ? "Remove flag" : "Flag account"}
                    className={cx(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition-colors",
                      user.flagged ? "border-neg/40 bg-neg/10 text-neg" : "border-line bg-raised/40 text-ink-3 hover:bg-raised"
                    )}
                  >
                    ⚑
                  </button>
                  {canReview ? (
                    <>
                      <button
                        onClick={() => setRejecting(true)}
                        className="flex-1 rounded-lg border border-line py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-white/[0.04]"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => review("verified")}
                        disabled={busy}
                        className="flex-1 rounded-lg border border-mint/50 bg-mint/10 py-2.5 text-sm font-medium text-mint transition-colors disabled:opacity-50"
                      >
                        Approve
                      </button>
                    </>
                  ) : (
                    <div className="flex-1 text-center text-[12.5px] text-ink-3">
                      {user.kyc?.status === "verified" ? "This account is verified." : user.kyc?.status === "rejected" ? "Awaiting re-submission." : "No pending submission."}
                    </div>
                  )}
                </div>
              )}
            </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line-soft py-2 last:border-0">
      <span className="text-[12.5px] text-ink-3">{label}</span>
      <span className={cx("text-right text-[13px] text-ink-2", mono && "tnum")}>{value}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white/[0.02] p-2.5">
      <p className="text-[10.5px] text-ink-3">{label}</p>
      <p className="tnum mt-0.5 text-[13.5px] font-semibold text-ink">{value}</p>
    </div>
  );
}
