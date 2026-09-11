"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { account, useAccountState } from "@/lib/accountClient";
import { LogoMark } from "@/components/ui/Logo";

function Form({ mode }: { mode: "signup" | "login" }) {
  const router = useRouter();
  const params = useSearchParams();
  const state = useAccountState();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const copyTarget = params.get("copy");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (mode === "signup" && name.trim().length < 2) {
      setError("Enter your name.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        await account.signUp(name.trim(), email.trim(), password);
      } else {
        await account.logIn(email.trim(), password);
      }
      router.push(copyTarget ? `/traders/${copyTarget}` : "/wallet");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="flex justify-center">
        <LogoMark className="h-12 w-12" />
      </div>
      <h1 className="font-display mt-6 text-center text-3xl font-semibold tracking-tight">
        {mode === "signup" ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-3 text-center text-ink-2">
        {mode === "signup"
          ? "Start with a $100,000 practice balance. No card required."
          : "Log in to your portfolio."}
      </p>

      <form onSubmit={submit} className="panel mt-8 space-y-5 p-7">
        {mode === "signup" && (
          <div>
            <label htmlFor="name" className="text-xs font-medium uppercase tracking-wide text-ink-3">
              Full name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Investor"
              autoComplete="name"
              className="mt-2 w-full rounded-xl border border-line bg-raised/60 px-4 py-3 text-ink placeholder:text-ink-3 focus:border-mint/50 focus:outline-none"
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="text-xs font-medium uppercase tracking-wide text-ink-3">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="mt-2 w-full rounded-xl border border-line bg-raised/60 px-4 py-3 text-ink placeholder:text-ink-3 focus:border-mint/50 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-xs font-medium uppercase tracking-wide text-ink-3">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="mt-2 w-full rounded-xl border border-line bg-raised/60 px-4 py-3 text-ink placeholder:text-ink-3 focus:border-mint/50 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-neg">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="sheen relative w-full overflow-hidden rounded-full bg-gradient-to-r from-violet via-mint to-fuchsia py-3.5 text-sm font-semibold text-[#06060c] disabled:opacity-60"
        >
          {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
        </button>

        <p className="text-center text-[11px] leading-relaxed text-ink-3">
          Your account is real and persisted — trading funds are practice-mode only ($100,000 virtual
          balance, no real money).
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-ink-2">
        {mode === "signup" ? (
          <>Already have an account? <Link href="/login" className="text-mint hover:underline">Log in</Link></>
        ) : (
          <>New to Asport Traders? <Link href="/signup" className="text-mint hover:underline">Create an account</Link></>
        )}
      </p>

      {state.ready && state.user && (
        <p className="mt-4 text-center text-sm text-ink-3">
          Signed in as {state.user.email} — <Link href="/wallet" className="text-mint hover:underline">go to your account</Link>
        </p>
      )}
    </div>
  );
}

export default function AuthForm({ mode }: { mode: "signup" | "login" }) {
  return (
    <Suspense>
      <Form mode={mode} />
    </Suspense>
  );
}
