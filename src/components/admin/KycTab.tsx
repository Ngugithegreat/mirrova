"use client";

import { useEffect, useState } from "react";
import { cx } from "@/lib/format";

type KycRow = {
  userId: string;
  status: "unsubmitted" | "pending" | "verified" | "rejected";
  fullName: string;
  idType: string;
  idNumberMasked: string;
  dateOfBirth: string;
  address: string;
  submittedAt: string | null;
  reviewNote: string | null;
  user: { id: string; name: string; email: string } | null;
  documents: { id: string; kind: string; blobPathname: string }[];
};

const STATUS_TONE: Record<string, string> = {
  verified: "bg-pos/10 text-pos",
  pending: "bg-warn/10 text-warn",
  rejected: "bg-neg/10 text-neg",
  unsubmitted: "bg-ink-3/10 text-ink-3",
};

const FILTERS = ["all", "pending", "verified", "rejected"] as const;
const ID_TYPE_LABEL: Record<string, string> = { passport: "Passport", national_id: "National ID", drivers_license: "Driver's license" };

export default function KycTab() {
  const [rows, setRows] = useState<KycRow[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    const url = filter === "all" ? "/api/admin/kyc" : `/api/admin/kyc?status=${filter}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => setRows(d.queue ?? []))
      .catch(() => setRows([]));
  }

  useEffect(load, [filter]);

  async function review(userId: string, decision: "verified" | "rejected") {
    setBusyId(userId);
    setError(null);
    try {
      const res = await fetch("/api/admin/kyc/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, decision }),
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
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
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

      {error && <p className="mt-3 text-sm text-neg">{error}</p>}

      {!rows ? (
        <div className="py-16 text-center text-ink-3">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="panel mt-4 p-10 text-center text-ink-2">No submissions found.</div>
      ) : (
        <div className="mt-4 space-y-4">
          {rows.map((r) => (
            <div key={r.userId} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-ink">{r.fullName}</div>
                  <div className="text-xs text-ink-3">
                    {r.user?.name ?? "—"} · {r.user?.email ?? "unknown user"}
                  </div>
                </div>
                <span className={cx("rounded-md px-2 py-0.5 text-xs font-medium capitalize", STATUS_TONE[r.status])}>{r.status}</span>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-3">ID type</div>
                  <div className="mt-0.5 text-ink-2">{ID_TYPE_LABEL[r.idType] ?? r.idType}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-3">ID number</div>
                  <div className="tnum mt-0.5 text-ink-2">{r.idNumberMasked}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-3">Date of birth</div>
                  <div className="tnum mt-0.5 text-ink-2">{r.dateOfBirth}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-3">Address</div>
                  <div className="mt-0.5 text-ink-2">{r.address}</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {r.documents.length === 0 ? (
                  <span className="text-xs text-ink-3">No documents uploaded.</span>
                ) : (
                  r.documents.map((d) => (
                    <a
                      key={d.id}
                      href={`/api/admin/kyc/doc?path=${encodeURIComponent(d.blobPathname)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink-2 capitalize transition-colors hover:border-mint/50 hover:text-mint"
                    >
                      View {d.kind.replace("_", " ")}
                    </a>
                  ))
                )}
              </div>

              {r.reviewNote && <p className="mt-3 text-xs text-ink-3">Note: {r.reviewNote}</p>}

              {r.status === "pending" && (
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => review(r.userId, "verified")}
                    disabled={busyId === r.userId}
                    className="rounded-lg border border-line px-3.5 py-1.5 text-xs text-ink-2 transition-colors hover:border-mint/50 hover:text-mint disabled:opacity-50"
                  >
                    {busyId === r.userId ? "…" : "Approve"}
                  </button>
                  <button
                    onClick={() => review(r.userId, "rejected")}
                    disabled={busyId === r.userId}
                    className="rounded-lg border border-line px-3.5 py-1.5 text-xs text-ink-2 transition-colors hover:border-neg/50 hover:text-neg disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
