"use client";

import { useState } from "react";
import { LogoMark } from "@/components/ui/Logo";

export default function AdminGate() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-bg px-5">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.16), transparent 60%)" }}
      />
      <div className="panel relative w-full max-w-sm rounded-2xl p-7">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-violet/30 bg-violet/10">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-violet" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3.5l7 2.8v5.4c0 4.4-2.9 7.9-7 9.3-4.1-1.4-7-4.9-7-9.3V6.3z" />
              <path d="M8.8 12.2l2.1 2.1 4.3-4.3" />
            </svg>
          </div>
          <div>
            <h1 className="text-[17px] font-semibold text-ink">Admin console</h1>
            <p className="text-[12.5px] text-ink-3">Authorised staff only</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="password" className="text-xs font-medium uppercase tracking-wide text-ink-3">
              Admin password
            </label>
            <div className="relative mt-1.5">
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="4.3" />
                <path d="M11 11l9 9M17 15l2.5-2.5M20 18l1.5-1.5" />
              </svg>
              <input
                id="password"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Enter admin password"
                className="w-full rounded-xl border border-line bg-raised/60 py-3 pl-10 pr-4 text-sm text-ink focus:border-mint/50 focus:outline-none"
              />
            </div>
          </div>
          {error && <p className="text-[12.5px] text-neg">{error}</p>}
          <button
            type="submit"
            disabled={busy || !password}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet via-mint to-fuchsia py-3 text-sm font-semibold text-[#06060c] disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="11" width="14" height="9" rx="1.6" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            {busy ? "Checking…" : "Unlock console"}
          </button>
        </form>
      </div>
      <div className="absolute top-6 left-6">
        <LogoMark className="h-9 w-9" />
      </div>
    </div>
  );
}
