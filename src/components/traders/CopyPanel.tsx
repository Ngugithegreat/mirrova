"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { account, useAccountState } from "@/lib/accountClient";
import { realAccount, useRealAccountState } from "@/lib/realAccountClient";
import { useSessionMode } from "@/lib/sessionMode";
import { fmtMoney } from "@/lib/format";

type Props = {
  slug: string;
  name: string;
  perfFee: number;
  minCopy: number;
};

export default function CopyPanel({ slug, name, perfFee, minCopy }: Props) {
  const state = useAccountState();
  const real = useRealAccountState();
  const mode = useSessionMode();
  const router = useRouter();
  const [amount, setAmount] = useState(1000);
  const [stop, setStop] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const first = name.split(" ")[0];
  const alreadyDemo = state.copies.some((c) => c.slug === slug);
  const alreadyReal = real.allocation?.slug === slug;

  async function startDemo() {
    setError(null);
    if (state.ready && !state.user) {
      router.push(`/signup?copy=${slug}`);
      return;
    }
    if (amount < minCopy) {
      setError(`Minimum copy amount for ${first} is ${fmtMoney(minCopy)}.`);
      return;
    }
    setBusy(true);
    try {
      await account.startCopy(slug, Math.round(amount * 100), stop);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function startReal() {
    setError(null);
    if (state.ready && !state.user) {
      router.push(`/signup?copy=${slug}`);
      return;
    }
    if (real.realCashCents <= 0) {
      router.push("/wallet");
      return;
    }
    setBusy(true);
    try {
      await realAccount.allocate(slug);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  // --- Real mode: all-or-nothing, no amount picker at all ---
  if (mode === "real") {
    if (alreadyReal) {
      return (
        <div className="panel glow-ring p-6">
          <div className="flex items-center gap-2.5 text-mint">
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.8a1 1 0 0 0-1.4-1.4L9 10.1 7.7 8.8a1 1 0 1 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4Z" />
            </svg>
            <span className="font-semibold">You&apos;re copying {first} with real funds</span>
          </div>
          <p className="mt-2 text-sm text-ink-2">Manage the allocation and see your live position from your wallet.</p>
          <Link href="/wallet" className="mt-4 block sheen relative overflow-hidden rounded-full bg-gradient-to-r from-violet via-mint to-fuchsia py-3 text-center text-sm font-semibold text-[#06060c]">
            Open wallet
          </Link>
        </div>
      );
    }
    if (real.allocation) {
      return (
        <div className="panel p-6">
          <h3 className="font-display text-lg font-semibold text-ink">Copy {first} with real funds</h3>
          <p className="mt-3 text-sm text-ink-2">
            You already have an active real allocation to another trader — real allocations are one at a time. Stop
            it from your wallet before switching.
          </p>
          <Link href="/wallet" className="mt-4 block rounded-full border border-line py-3 text-center text-sm font-medium text-ink-2 transition-colors hover:border-mint/50 hover:text-mint">
            Go to wallet
          </Link>
        </div>
      );
    }
    return (
      <div className="panel glow-ring p-6">
        <h3 className="font-display text-lg font-semibold text-ink">Copy {first} with real funds</h3>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">
          Real allocations are all-or-nothing — your full available real balance
          {real.ready && real.realCashCents > 0 ? <> ({fmtMoney(real.realCashCents / 100, 2)})</> : null} goes to
          this trader, no partial amounts.
        </p>
        <div className="mt-5 space-y-2 border-t border-line-soft pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-2">Performance fee</span>
            <span className="tnum text-ink">{perfFee}% of profits</span>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-neg">{error}</p>}
        <button
          onClick={startReal}
          disabled={busy}
          className="mt-5 w-full sheen relative overflow-hidden rounded-full bg-gradient-to-r from-violet via-mint to-fuchsia py-3.5 text-sm font-semibold text-[#06060c] disabled:opacity-60"
        >
          {busy
            ? "Please wait…"
            : real.ready && real.realCashCents <= 0
              ? "Deposit to start copying"
              : `Allocate full balance to ${first}`}
        </button>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-3">
          Real money — capital at risk. Not available in every jurisdiction.
        </p>
      </div>
    );
  }

  // --- Demo mode: unchanged sized/multi-trader flow ---
  if (alreadyDemo) {
    return (
      <div className="panel glow-ring p-6">
        <div className="flex items-center gap-2.5 text-mint">
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.8a1 1 0 0 0-1.4-1.4L9 10.1 7.7 8.8a1 1 0 1 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4Z" />
          </svg>
          <span className="font-semibold">You&apos;re copying {first}</span>
        </div>
        <p className="mt-2 text-sm text-ink-2">Manage the relationship from your portfolio.</p>
        <Link href="/dashboard" className="mt-4 block sheen relative overflow-hidden rounded-full bg-gradient-to-r from-violet via-mint to-fuchsia py-3 text-center text-sm font-semibold text-[#06060c]">
          Open portfolio
        </Link>
      </div>
    );
  }

  return (
    <div className="panel glow-ring p-6">
      <h3 className="font-display text-lg font-semibold text-ink">Copy {first}</h3>

      <label className="mt-5 block text-xs font-medium uppercase tracking-wide text-ink-3">Amount (USD)</label>
      <div className="mt-2 flex items-center gap-2">
        {[500, 1000, 5000].map((v) => (
          <button
            key={v}
            onClick={() => setAmount(v)}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              amount === v ? "border-mint/50 bg-mint/10 text-mint" : "border-line text-ink-2 hover:text-ink"
            }`}
          >
            ${v.toLocaleString()}
          </button>
        ))}
      </div>
      <input
        type="number"
        min={minCopy}
        step={100}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="tnum mt-2.5 w-full rounded-xl border border-line bg-raised/60 px-4 py-3 text-lg font-semibold text-ink focus:border-mint/50 focus:outline-none"
        aria-label="Copy amount in US dollars"
      />

      <div className="mt-5 flex items-center justify-between">
        <label htmlFor="stop" className="text-xs font-medium uppercase tracking-wide text-ink-3">
          Copy stop-loss
        </label>
        <span className="tnum text-sm font-semibold text-ink">−{stop}%</span>
      </div>
      <input
        id="stop"
        type="range"
        min={5}
        max={50}
        step={5}
        value={stop}
        onChange={(e) => setStop(Number(e.target.value))}
        className="mt-2 w-full accent-[#22d3ee]"
      />
      <p className="mt-1.5 text-xs leading-relaxed text-ink-3">
        If this copy falls {stop}%, all mirrored positions close automatically and{" "}
        <span className="tnum text-ink-2">{fmtMoney(amount * (1 - stop / 100))}</span>+ returns to cash.
      </p>

      <div className="mt-5 space-y-2 border-t border-line-soft pt-4 text-sm">
        <div className="flex justify-between"><span className="text-ink-2">Management fee</span><span className="tnum text-ink">$0</span></div>
        <div className="flex justify-between"><span className="text-ink-2">Performance fee</span><span className="tnum text-ink">{perfFee}% of profits</span></div>
        <div className="flex justify-between"><span className="text-ink-2">Minimum</span><span className="tnum text-ink">{fmtMoney(minCopy)}</span></div>
      </div>

      {error && <p className="mt-3 text-sm text-neg">{error}</p>}

      <button
        onClick={startDemo}
        disabled={busy}
        className="mt-5 w-full sheen relative overflow-hidden rounded-full bg-gradient-to-r from-violet via-mint to-fuchsia py-3.5 text-sm font-semibold text-[#06060c] disabled:opacity-60"
      >
        {busy ? "Please wait…" : state.ready && state.user ? `Start copying ${first}` : "Sign up & start copying"}
      </button>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-3">
        Practice mode — trades simulate with a $100k virtual balance. Capital at risk when live.
      </p>
    </div>
  );
}
