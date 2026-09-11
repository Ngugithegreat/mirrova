"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccountState } from "@/lib/accountClient";
import { realAccount, useRealAccountState } from "@/lib/realAccountClient";
import { TRADERS, getTrader } from "@/lib/traders";
import { fmtMoney } from "@/lib/format";
import { ButtonLink } from "@/components/ui/Button";
import TraderAvatar from "@/components/ui/TraderAvatar";

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const STATUS_TONE: Record<string, string> = {
  completed: "bg-pos/10 text-pos",
  pending: "bg-warn/10 text-warn",
  failed: "bg-neg/10 text-neg",
};

export default function RealWallet() {
  const account = useAccountState();
  const real = useRealAccountState();

  const [phone, setPhone] = useState("");
  const [amountKes, setAmountKes] = useState(1000);
  const [depositBusy, setDepositBusy] = useState(false);
  const [depositMsg, setDepositMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [selectedSlug, setSelectedSlug] = useState("");
  const [allocBusy, setAllocBusy] = useState(false);
  const [allocError, setAllocError] = useState<string | null>(null);

  if (!account.ready || !real.ready) {
    return <div className="mx-auto max-w-4xl px-5 py-24 text-center text-ink-3">Loading wallet…</div>;
  }

  if (!account.user) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold">Sign in for your real wallet</h1>
        <p className="mt-4 text-ink-2">Create a free account to deposit via M-Pesa and copy a strategist with real funds.</p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/signup">Create account</ButtonLink>
          <ButtonLink href="/login" variant="secondary">Log in</ButtonLink>
        </div>
      </div>
    );
  }

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    setDepositMsg(null);
    setDepositBusy(true);
    try {
      const checkoutRequestId = await realAccount.deposit(phone, amountKes);
      setDepositMsg({ kind: "ok", text: "Check your phone and enter your M-Pesa PIN to complete the deposit…" });
      const status = await realAccount.pollDeposit(checkoutRequestId);
      if (status === "completed") {
        setDepositMsg({ kind: "ok", text: "Deposit received and credited to your real balance." });
      } else if (status === "failed") {
        setDepositMsg({ kind: "err", text: "The M-Pesa payment wasn't completed. You can try again." });
      } else {
        setDepositMsg({ kind: "err", text: "Still waiting on M-Pesa — check your Deposit history below shortly." });
      }
    } catch (err) {
      setDepositMsg({ kind: "err", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setDepositBusy(false);
    }
  }

  async function handleAllocate() {
    if (!selectedSlug) {
      setAllocError("Choose a strategist first.");
      return;
    }
    setAllocError(null);
    setAllocBusy(true);
    try {
      await realAccount.allocate(selectedSlug);
    } catch (err) {
      setAllocError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setAllocBusy(false);
    }
  }

  async function handleDeallocate() {
    setAllocBusy(true);
    try {
      await realAccount.deallocate();
    } finally {
      setAllocBusy(false);
    }
  }

  const cash = real.realCashCents / 100;
  const allocTrader = real.allocation ? getTrader(real.allocation.slug) : null;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-ink-3">
              <Link href="/dashboard" className="hover:text-ink">← Practice portfolio</Link>
            </p>
            <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight">Real wallet</h1>
          </div>
        </div>

        <p className="panel mt-6 border-warn/30 bg-warn/5 p-4 text-sm leading-relaxed text-ink-2">
          <strong className="text-warn">Real money.</strong> Deposits here are genuine funds, converted from KES to
          USD and allocated in full to one strategist at a time — never a partial amount. Capital at risk; this is
          not available in every jurisdiction.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Deposit */}
          <div className="panel glow-ring p-6">
            <div className="text-[11px] uppercase tracking-wide text-ink-3">Available real balance</div>
            <div className="tnum mt-1.5 font-display text-3xl font-semibold text-ink">{fmtMoney(cash, 2)}</div>

            <form onSubmit={handleDeposit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="phone" className="text-xs font-medium uppercase tracking-wide text-ink-3">
                  M-Pesa phone number
                </label>
                <input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712345678"
                  className="mt-2 w-full rounded-xl border border-line bg-raised/60 px-4 py-3 text-ink placeholder:text-ink-3 focus:border-mint/50 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="amountKes" className="text-xs font-medium uppercase tracking-wide text-ink-3">
                  Amount (KES)
                </label>
                <div className="mt-2 flex items-center gap-2">
                  {[500, 1000, 5000, 10000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmountKes(v)}
                      className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                        amountKes === v ? "border-mint/50 bg-mint/10 text-mint" : "border-line text-ink-2 hover:text-ink"
                      }`}
                    >
                      {v.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input
                  id="amountKes"
                  type="number"
                  min={10}
                  step={1}
                  value={amountKes}
                  onChange={(e) => setAmountKes(Number(e.target.value))}
                  className="tnum mt-2.5 w-full rounded-xl border border-line bg-raised/60 px-4 py-3 text-lg font-semibold text-ink focus:border-mint/50 focus:outline-none"
                />
              </div>

              {depositMsg && (
                <p className={`text-sm ${depositMsg.kind === "ok" ? "text-mint" : "text-neg"}`}>{depositMsg.text}</p>
              )}

              <button
                type="submit"
                disabled={depositBusy}
                className="sheen relative w-full overflow-hidden rounded-full bg-gradient-to-r from-violet via-mint to-fuchsia py-3.5 text-sm font-semibold text-[#06060c] disabled:opacity-60"
              >
                {depositBusy ? "Check your phone…" : "Deposit via M-Pesa"}
              </button>
            </form>
          </div>

          {/* Allocation */}
          <div className="panel p-6">
            <div className="text-[11px] uppercase tracking-wide text-ink-3">Real copy allocation</div>

            {allocTrader && real.allocation ? (
              <div className="mt-4">
                <Link href={`/traders/${real.allocation.slug}`} className="flex items-center gap-3">
                  <TraderAvatar name={allocTrader.name} />
                  <div>
                    <div className="font-medium text-ink">{allocTrader.name}</div>
                    <div className="text-xs text-ink-3">{allocTrader.strategy}</div>
                  </div>
                </Link>
                <div className="mt-4 border-t border-line-soft pt-4">
                  <div className="text-[11px] uppercase tracking-wide text-ink-3">Allocated</div>
                  <div className="tnum mt-0.5 text-xl font-semibold text-ink">
                    {fmtMoney(real.allocation.amountCents / 100, 2)}
                  </div>
                </div>
                <button
                  onClick={handleDeallocate}
                  disabled={allocBusy}
                  className="mt-5 w-full rounded-lg border border-line px-4 py-2.5 text-sm text-ink-2 transition-colors hover:border-neg/50 hover:text-neg disabled:opacity-50"
                >
                  {allocBusy ? "Stopping…" : "Stop & return principal"}
                </button>
                <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
                  Stopping returns your original allocated principal to your available balance.
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm leading-relaxed text-ink-2">
                  Choose a strategist to allocate your full available balance ({fmtMoney(cash, 2)}) to — real
                  allocations are all-or-nothing.
                </p>
                <select
                  value={selectedSlug}
                  onChange={(e) => setSelectedSlug(e.target.value)}
                  className="mt-4 w-full rounded-xl border border-line bg-raised/60 px-4 py-3 text-sm text-ink focus:border-mint/50 focus:outline-none"
                >
                  <option value="">Select a strategist…</option>
                  {TRADERS.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.name} — {t.strategy}
                    </option>
                  ))}
                </select>
                {allocError && <p className="mt-3 text-sm text-neg">{allocError}</p>}
                <button
                  onClick={handleAllocate}
                  disabled={allocBusy || cash <= 0}
                  className="sheen relative mt-4 w-full overflow-hidden rounded-full bg-gradient-to-r from-violet via-mint to-fuchsia py-3 text-sm font-semibold text-[#06060c] disabled:opacity-60"
                >
                  {allocBusy ? "Allocating…" : "Allocate full balance"}
                </button>
                {cash <= 0 && <p className="mt-3 text-[11px] text-ink-3">Deposit first to have a balance to allocate.</p>}
              </div>
            )}
          </div>
        </div>

        <h2 className="font-display mt-10 text-xl font-semibold">Deposit history</h2>
        {real.payments.length === 0 ? (
          <div className="panel mt-4 p-8 text-center text-sm text-ink-3">No deposits yet.</div>
        ) : (
          <div className="panel mt-4 divide-y divide-line-soft">
            {real.payments.map((p) => (
              <div key={p.checkoutRequestId} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm">
                <span className="tnum text-ink-2">
                  KES {(p.kesCents / 100).toLocaleString()}
                  {p.creditedUsdCents != null && <span className="text-ink-3"> → {fmtMoney(p.creditedUsdCents / 100, 2)}</span>}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_TONE[p.status] ?? ""}`}>
                  {p.status}
                </span>
                <span className="shrink-0 text-xs text-ink-3">{timeAgo(p.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
