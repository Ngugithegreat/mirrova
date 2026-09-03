"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { demo, useDemoState } from "@/lib/demoStore";
import { fmtMoney } from "@/lib/format";

type Props = {
  slug: string;
  name: string;
  perfFee: number;
  minCopy: number;
};

export default function CopyPanel({ slug, name, perfFee, minCopy }: Props) {
  const state = useDemoState();
  const router = useRouter();
  const [amount, setAmount] = useState(1000);
  const [stop, setStop] = useState(20);
  const [error, setError] = useState<string | null>(null);

  const already = state.copies.some((c) => c.slug === slug);
  const first = name.split(" ")[0];

  function start() {
    setError(null);
    if (!state.user) {
      router.push(`/signup?copy=${slug}`);
      return;
    }
    if (amount < minCopy) {
      setError(`Minimum copy amount for ${first} is ${fmtMoney(minCopy)}.`);
      return;
    }
    const res = demo.startCopy(slug, amount, stop);
    if (res === "insufficient") setError(`Not enough available cash (${fmtMoney(state.cash)}).`);
    else if (res === "ok") router.push("/dashboard");
  }

  if (already) {
    return (
      <div className="panel glow-ring p-6">
        <div className="flex items-center gap-2.5 text-mint">
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.8a1 1 0 0 0-1.4-1.4L9 10.1 7.7 8.8a1 1 0 1 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4Z" />
          </svg>
          <span className="font-semibold">You&apos;re copying {first}</span>
        </div>
        <p className="mt-2 text-sm text-ink-2">Manage the relationship from your portfolio.</p>
        <Link href="/dashboard" className="mt-4 block rounded-xl bg-mint py-3 text-center text-sm font-semibold text-[#052e1f] hover:bg-[#54ebb6]">
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
        className="mt-2 w-full accent-[#3ce3a7]"
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

      <button onClick={start} className="mt-5 w-full rounded-xl bg-mint py-3.5 text-sm font-semibold text-[#052e1f] transition-colors hover:bg-[#54ebb6]">
        {state.user ? `Start copying ${first}` : "Sign up & start copying"}
      </button>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-3">
        Practice mode — trades simulate with a $100k virtual balance. Capital at risk when live.
      </p>
    </div>
  );
}
