"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { demo, useDemoState } from "@/lib/demoStore";
import { LogoMark } from "@/components/ui/Logo";

function Form({ mode }: { mode: "signup" | "login" }) {
  const router = useRouter();
  const params = useSearchParams();
  const state = useDemoState();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const copyTarget = params.get("copy");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (mode === "signup") {
      if (name.trim().length < 2) {
        setError("Enter your name.");
        return;
      }
      demo.signUp(name.trim(), email.trim());
    } else {
      demo.logIn(email.trim());
    }
    router.push(copyTarget ? `/traders/${copyTarget}` : "/dashboard");
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
            className="mt-2 w-full rounded-xl border border-line bg-raised/60 px-4 py-3 text-ink placeholder:text-ink-3 focus:border-mint/50 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-neg">{error}</p>}

        <button type="submit" className="w-full sheen relative overflow-hidden rounded-full bg-gradient-to-r from-violet via-mint to-fuchsia py-3.5 text-sm font-semibold text-[#06060c]">
          {mode === "signup" ? "Create account" : "Log in"}
        </button>

        <p className="text-center text-[11px] leading-relaxed text-ink-3">
          Practice mode: no password or card needed for this preview. Your session is stored on this
          device only.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-ink-2">
        {mode === "signup" ? (
          <>Already have an account? <Link href="/login" className="text-mint hover:underline">Log in</Link></>
        ) : (
          <>New to Mirrova? <Link href="/signup" className="text-mint hover:underline">Create an account</Link></>
        )}
      </p>

      {state.user && (
        <p className="mt-4 text-center text-sm text-ink-3">
          Signed in as {state.user.email} — <Link href="/dashboard" className="text-mint hover:underline">go to portfolio</Link>
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
