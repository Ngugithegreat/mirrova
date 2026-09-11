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
    <div className="mx-auto flex min-h-[80vh] w-full max-w-sm flex-col justify-center px-5">
      <div className="flex justify-center">
        <LogoMark className="h-12 w-12" />
      </div>
      <h1 className="font-display mt-6 text-center text-2xl font-semibold tracking-tight">Admin</h1>
      <p className="mt-2 text-center text-sm text-ink-3">Restricted — authorized staff only.</p>

      <form onSubmit={submit} className="panel mt-8 space-y-4 p-6">
        <div>
          <label htmlFor="password" className="text-xs font-medium uppercase tracking-wide text-ink-3">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-raised/60 px-4 py-3 text-ink focus:border-mint/50 focus:outline-none"
          />
        </div>
        {error && <p className="text-sm text-neg">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="w-full rounded-full bg-gradient-to-r from-violet via-mint to-fuchsia py-3 text-sm font-semibold text-[#06060c] disabled:opacity-60"
        >
          {busy ? "Checking…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
