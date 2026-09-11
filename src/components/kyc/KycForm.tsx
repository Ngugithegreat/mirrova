"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccountState } from "@/lib/accountClient";
import { refreshRealAccount } from "@/lib/realAccountClient";
import { LogoMark } from "@/components/ui/Logo";

type Status = "unsubmitted" | "pending" | "verified" | "rejected";

type KycData = {
  status: Status;
  fullName: string | null;
  idType: string | null;
  idNumberMasked: string | null;
  dateOfBirth: string | null;
  address: string | null;
  reviewNote: string | null;
  documents: { kind: string }[];
};

const ID_TYPES = [
  { id: "passport", label: "Passport" },
  { id: "national_id", label: "National ID" },
  { id: "drivers_license", label: "Driver's license" },
];

const DOC_KINDS: { key: "id_front" | "id_back" | "selfie"; label: string }[] = [
  { key: "id_front", label: "ID front" },
  { key: "id_back", label: "ID back" },
  { key: "selfie", label: "Selfie holding your ID" },
];

export default function KycForm() {
  const account = useAccountState();
  const [data, setData] = useState<KycData | null>(null);

  const [fullName, setFullName] = useState("");
  const [idType, setIdType] = useState("passport");
  const [idNumber, setIdNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploaded, setUploaded] = useState<Set<string>>(new Set());
  const [uploadBusy, setUploadBusy] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function load() {
    fetch("/api/kyc/status")
      .then((r) => r.json())
      .then((d: KycData) => {
        setData(d);
        setUploaded(new Set(d.documents?.map((doc) => doc.kind) ?? []));
      })
      .catch(() => setData(null));
  }

  useEffect(load, []);

  async function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/kyc/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, idType, idNumber, dateOfBirth, address }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile(kind: string, file: File) {
    setUploadBusy(kind);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("kind", kind);
      form.append("file", file);
      const res = await fetch("/api/kyc/upload", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong.");
      setUploaded((prev) => new Set(prev).add(kind));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setUploadBusy(null);
    }
  }

  async function finishSubmission() {
    await refreshRealAccount();
    load();
  }

  if (!account.ready || !data) {
    return <div className="mx-auto max-w-2xl px-5 py-24 text-center text-ink-3">Loading…</div>;
  }

  if (!account.user) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <p className="text-ink-2">Sign in to verify your identity.</p>
        <Link href="/login" className="mt-4 inline-block text-mint hover:underline">Log in</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-5 py-16">
      <div className="flex justify-center">
        <LogoMark className="h-12 w-12" />
      </div>
      <h1 className="font-display mt-6 text-center text-3xl font-semibold tracking-tight">Verify your identity</h1>
      <p className="mt-3 text-center text-ink-2">Required once, before your first withdrawal. Deposits and copying don&apos;t need this.</p>

      {data.status === "verified" && (
        <div className="panel mt-8 p-7 text-center">
          <p className="text-sm font-medium text-pos">Your identity is verified.</p>
          <Link href="/wallet" className="mt-4 inline-block text-mint hover:underline">Back to your wallet</Link>
        </div>
      )}

      {data.status === "pending" && (
        <div className="panel mt-8 p-7 text-center">
          <p className="text-sm font-medium text-ink">Your submission is under review.</p>
          <p className="mt-1.5 text-sm text-ink-2">We&apos;ll notify you once it&apos;s approved — this usually takes under a day.</p>
          {uploaded.size < DOC_KINDS.length && <p className="mt-1.5 text-xs text-ink-3">You can still finish uploading documents below.</p>}
        </div>
      )}

      {data.status !== "verified" && (
        <>
          {data.status === "rejected" && (
            <div className="mt-6 rounded-xl border border-neg/30 bg-neg/5 p-4 text-sm text-ink-2">
              Your previous submission was rejected{data.reviewNote ? `: ${data.reviewNote}` : "."} Please resubmit below.
            </div>
          )}

          {data.status !== "pending" && (
          <form onSubmit={submitProfile} className="panel mt-6 space-y-5 p-7">
            <div>
              <label htmlFor="fullName" className="text-xs font-medium uppercase tracking-wide text-ink-3">
                Full legal name
              </label>
              <input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="As it appears on your ID"
                className="mt-2 w-full rounded-xl border border-line bg-raised/60 px-4 py-3 text-ink placeholder:text-ink-3 focus:border-mint/50 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="idType" className="text-xs font-medium uppercase tracking-wide text-ink-3">
                ID type
              </label>
              <select
                id="idType"
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="mt-2 w-full rounded-xl border border-line bg-raised/60 px-4 py-3 text-ink focus:border-mint/50 focus:outline-none"
              >
                {ID_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="idNumber" className="text-xs font-medium uppercase tracking-wide text-ink-3">
                ID number
              </label>
              <input
                id="idNumber"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="mt-2 w-full rounded-xl border border-line bg-raised/60 px-4 py-3 text-ink focus:border-mint/50 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="dateOfBirth" className="text-xs font-medium uppercase tracking-wide text-ink-3">
                Date of birth
              </label>
              <input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="tnum mt-2 w-full rounded-xl border border-line bg-raised/60 px-4 py-3 text-ink focus:border-mint/50 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="address" className="text-xs font-medium uppercase tracking-wide text-ink-3">
                Residential address
              </label>
              <input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-2 w-full rounded-xl border border-line bg-raised/60 px-4 py-3 text-ink focus:border-mint/50 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-neg">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="sheen relative w-full overflow-hidden rounded-full bg-gradient-to-r from-violet via-mint to-fuchsia py-3.5 text-sm font-semibold text-[#06060c] disabled:opacity-60"
            >
              {busy ? "Please wait…" : "Save details"}
            </button>
          </form>
          )}

          <div className="panel mt-6 p-7">
            <div className="text-[11px] uppercase tracking-wide text-ink-3">Documents</div>
            <p className="mt-1.5 text-sm text-ink-2">Upload clear photos of your ID and a selfie holding it.</p>

            <div className="mt-4 space-y-3">
              {DOC_KINDS.map((d) => (
                <div key={d.key} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-raised/40 px-4 py-3">
                  <span className="text-sm text-ink-2">{d.label}</span>
                  {uploaded.has(d.key) ? (
                    <span className="text-xs font-medium text-pos">Uploaded ✓</span>
                  ) : (
                    <label className="cursor-pointer rounded-lg border border-line px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-mint/50 hover:text-mint">
                      {uploadBusy === d.key ? "Uploading…" : "Choose file"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadBusy === d.key}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadFile(d.key, file);
                        }}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
            {uploadError && <p className="mt-3 text-sm text-neg">{uploadError}</p>}

            {uploaded.size === DOC_KINDS.length && (
              <button
                onClick={finishSubmission}
                className="mt-5 w-full rounded-xl border border-mint/50 bg-mint/10 py-3 text-sm font-medium text-mint transition-colors hover:bg-mint/15"
              >
                Done — refresh status
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
