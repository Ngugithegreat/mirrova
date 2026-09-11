"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccountState } from "@/lib/accountClient";
import { realAccount, useRealAccountState } from "@/lib/realAccountClient";
import { TRADERS, getTrader } from "@/lib/traders";
import { ACCOUNT_TYPES } from "@/lib/accountTypes";
import { fmtMoney } from "@/lib/format";
import { ButtonLink } from "@/components/ui/Button";
import TraderAvatar from "@/components/ui/TraderAvatar";
import LiveSignalBadge from "@/components/traders/LiveSignalBadge";

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
  paid: "bg-pos/10 text-pos",
  rejected: "bg-neg/10 text-neg",
};

export default function RealWallet() {
  const account = useAccountState();
  const real = useRealAccountState();

  const [depositMethod, setDepositMethod] = useState<"mpesa" | "crypto">("mpesa");
  const [phone, setPhone] = useState("");
  const [amountKes, setAmountKes] = useState(1000);
  const [depositBusy, setDepositBusy] = useState(false);
  const [depositMsg, setDepositMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [cryptoAmountUsd, setCryptoAmountUsd] = useState(20);
  const [cryptoBusy, setCryptoBusy] = useState(false);
  const [cryptoMsg, setCryptoMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [cryptoDeposit, setCryptoDeposit] = useState<{ payAddress: string; payCurrency: string } | null>(null);

  const [selectedSlug, setSelectedSlug] = useState("");
  const [allocBusy, setAllocBusy] = useState(false);
  const [allocError, setAllocError] = useState<string | null>(null);

  const [switchBusy, setSwitchBusy] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState(5);
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

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

  async function handleCryptoDeposit(e: React.FormEvent) {
    e.preventDefault();
    setCryptoMsg(null);
    setCryptoBusy(true);
    try {
      const { providerPaymentId, payAddress, payCurrency } = await realAccount.depositCrypto(cryptoAmountUsd);
      setCryptoDeposit({ payAddress, payCurrency });
      setCryptoMsg({ kind: "ok", text: "Send the exact amount to the address below — this can take a few minutes to confirm." });
      const status = await realAccount.pollCryptoDeposit(providerPaymentId);
      if (status === "completed") {
        setCryptoMsg({ kind: "ok", text: "Deposit received and credited to your real balance." });
        setCryptoDeposit(null);
      } else if (status === "failed") {
        setCryptoMsg({ kind: "err", text: "The crypto payment wasn't completed. You can try again." });
        setCryptoDeposit(null);
      } else {
        setCryptoMsg({ kind: "err", text: "Still waiting on the network — check your Deposit history below shortly." });
      }
    } catch (err) {
      setCryptoMsg({ kind: "err", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setCryptoBusy(false);
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

  async function handleSwitchType(id: string) {
    setSwitchError(null);
    setSwitchBusy(id);
    try {
      await realAccount.switchType(id);
    } catch (err) {
      setSwitchError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSwitchBusy(null);
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setWithdrawMsg(null);
    setWithdrawBusy(true);
    try {
      await realAccount.withdraw(withdrawPhone, Math.round(withdrawAmount * 100));
      setWithdrawMsg({ kind: "ok", text: "Withdrawal requested — we'll pay it out to your phone shortly." });
    } catch (err) {
      setWithdrawMsg({ kind: "err", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setWithdrawBusy(false);
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

        {real.accountType && (
          <div className="panel mt-6 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="rounded-full border border-mint/30 bg-mint/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-mint">
                  {real.accountType.name}
                </span>
                <span className="text-sm text-ink-2">
                  1:{real.accountType.maxLeverage} · ${(real.totalDepositedUsdCents / 100).toLocaleString()} deposited lifetime
                </span>
              </div>
              <Link href="/pricing#account-types" className="text-xs font-medium text-mint hover:underline">
                Compare account types →
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-line-soft pt-4">
              {ACCOUNT_TYPES.filter((t) => t.id !== real.accountType!.id).map((t) => {
                const eligible = real.eligibleAccountTypes.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => eligible && handleSwitchType(t.id)}
                    disabled={!eligible || switchBusy === t.id}
                    title={eligible ? undefined : `Deposit $${(t.minDepositUsdCents / 100).toLocaleString()} lifetime to unlock`}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      eligible
                        ? "border-line text-ink-2 hover:border-mint/50 hover:text-mint"
                        : "cursor-not-allowed border-line-soft text-ink-3 opacity-60"
                    }`}
                  >
                    {switchBusy === t.id ? "Switching…" : `Switch to ${t.name}`}
                  </button>
                );
              })}
            </div>
            {switchError && <p className="mt-3 text-xs text-neg">{switchError}</p>}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Deposit */}
          <div className="panel glow-ring p-6">
            <div className="text-[11px] uppercase tracking-wide text-ink-3">Available real balance</div>
            <div className="tnum mt-1.5 font-display text-3xl font-semibold text-ink">{fmtMoney(cash, 2)}</div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setDepositMethod("mpesa")}
                className={`rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  depositMethod === "mpesa" ? "border-mint/50 bg-mint/10 text-mint" : "border-line text-ink-2 hover:text-ink"
                }`}
              >
                M-Pesa
              </button>
              <button
                type="button"
                onClick={() => setDepositMethod("crypto")}
                className={`rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  depositMethod === "crypto" ? "border-mint/50 bg-mint/10 text-mint" : "border-line text-ink-2 hover:text-ink"
                }`}
              >
                Crypto
              </button>
            </div>

            {depositMethod === "mpesa" ? (
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
            ) : (
              <form onSubmit={handleCryptoDeposit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="cryptoAmountUsd" className="text-xs font-medium uppercase tracking-wide text-ink-3">
                    Amount (USD, min $20)
                  </label>
                  <input
                    id="cryptoAmountUsd"
                    type="number"
                    min={20}
                    step={1}
                    value={cryptoAmountUsd}
                    onChange={(e) => setCryptoAmountUsd(Number(e.target.value))}
                    className="tnum mt-2 w-full rounded-xl border border-line bg-raised/60 px-4 py-3 text-lg font-semibold text-ink focus:border-mint/50 focus:outline-none"
                  />
                </div>

                {cryptoDeposit && (
                  <div className="rounded-xl border border-line bg-raised/60 p-4">
                    <div className="text-[11px] uppercase tracking-wide text-ink-3">Send USDT (TRC-20) to</div>
                    <div className="tnum mt-1.5 break-all text-sm text-ink">{cryptoDeposit.payAddress}</div>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(cryptoDeposit.payAddress)}
                      className="mt-2 text-xs font-medium text-mint hover:underline"
                    >
                      Copy address
                    </button>
                  </div>
                )}

                {cryptoMsg && <p className={`text-sm ${cryptoMsg.kind === "ok" ? "text-mint" : "text-neg"}`}>{cryptoMsg.text}</p>}

                <button
                  type="submit"
                  disabled={cryptoBusy}
                  className="sheen relative w-full overflow-hidden rounded-full bg-gradient-to-r from-violet via-mint to-fuchsia py-3.5 text-sm font-semibold text-[#06060c] disabled:opacity-60"
                >
                  {cryptoBusy ? "Waiting for payment…" : "Generate deposit address"}
                </button>
              </form>
            )}
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
                    <div className="mt-1.5"><LiveSignalBadge trader={allocTrader} /></div>
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

        {/* Withdraw */}
        <div className="panel mt-6 p-6">
          <div className="text-[11px] uppercase tracking-wide text-ink-3">Withdraw to M-Pesa</div>
          <p className="mt-1.5 text-sm text-ink-2">Withdraw from your available real balance ({fmtMoney(cash, 2)}).</p>

          <form onSubmit={handleWithdraw} className="mt-4 grid gap-4 sm:grid-cols-[1fr_140px_auto] sm:items-end">
            <div>
              <label htmlFor="withdrawPhone" className="text-xs font-medium uppercase tracking-wide text-ink-3">
                M-Pesa phone number
              </label>
              <input
                id="withdrawPhone"
                value={withdrawPhone}
                onChange={(e) => setWithdrawPhone(e.target.value)}
                placeholder="0712345678"
                className="mt-2 w-full rounded-xl border border-line bg-raised/60 px-4 py-3 text-ink placeholder:text-ink-3 focus:border-mint/50 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="withdrawAmount" className="text-xs font-medium uppercase tracking-wide text-ink-3">
                Amount (USD)
              </label>
              <input
                id="withdrawAmount"
                type="number"
                min={5}
                step={1}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                className="tnum mt-2 w-full rounded-xl border border-line bg-raised/60 px-4 py-3 text-ink focus:border-mint/50 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={withdrawBusy || cash <= 0}
              className="rounded-xl border border-line px-5 py-3 text-sm font-medium text-ink-2 transition-colors hover:border-mint/50 hover:text-mint disabled:opacity-50"
            >
              {withdrawBusy ? "Requesting…" : "Withdraw"}
            </button>
          </form>
          {withdrawMsg && <p className={`mt-3 text-sm ${withdrawMsg.kind === "ok" ? "text-mint" : "text-neg"}`}>{withdrawMsg.text}</p>}
          <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
            Withdrawals are processed manually and paid out to the M-Pesa number you provide — allow up to 1
            business day.
          </p>
        </div>

        <h2 className="font-display mt-10 text-xl font-semibold">Deposit history</h2>
        {real.payments.length === 0 ? (
          <div className="panel mt-4 p-8 text-center text-sm text-ink-3">No deposits yet.</div>
        ) : (
          <div className="panel mt-4 divide-y divide-line-soft">
            {real.payments.map((p, i) => (
              <div key={`${p.method}-${p.createdAt}-${i}`} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm">
                <span className="tnum text-ink-2">
                  <span className="mr-2 text-[11px] uppercase text-ink-3">{p.method}</span>
                  {p.displayAmount}
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

        <h2 className="font-display mt-10 text-xl font-semibold">Withdrawal history</h2>
        {real.withdrawals.length === 0 ? (
          <div className="panel mt-4 p-8 text-center text-sm text-ink-3">No withdrawals yet.</div>
        ) : (
          <div className="panel mt-4 divide-y divide-line-soft">
            {real.withdrawals.map((w) => (
              <div key={w.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm">
                <span className="tnum text-ink-2">{fmtMoney(w.amountUsdCents / 100, 2)}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_TONE[w.status] ?? ""}`}>{w.status}</span>
                <span className="shrink-0 text-xs text-ink-3">{timeAgo(w.requestedAt)}</span>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
