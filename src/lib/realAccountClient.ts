"use client";

import { useEffect, useSyncExternalStore } from "react";

export type RealPayment = {
  status: "pending" | "completed" | "failed";
  kesCents: number;
  creditedUsdCents: number | null;
  createdAt: string;
  checkoutRequestId: string;
};

export type RealAllocation = { slug: string; amountCents: number; startedAt: string };

export type RealAccountState = {
  ready: boolean;
  realCashCents: number;
  allocation: RealAllocation | null;
  payments: RealPayment[];
};

const EMPTY: RealAccountState = { ready: false, realCashCents: 0, allocation: null, payments: [] };

let state: RealAccountState = EMPTY;
const listeners = new Set<() => void>();

function setState(next: RealAccountState) {
  state = next;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return EMPTY;
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export async function refreshRealAccount() {
  try {
    const data = await fetchJson("/api/real/account");
    setState({
      ready: true,
      realCashCents: data.realCashCents ?? 0,
      allocation: data.allocation ?? null,
      payments: data.payments ?? [],
    });
  } catch {
    setState({ ...EMPTY, ready: true });
  }
}

export function useRealAccountState(): RealAccountState {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    refreshRealAccount();
  }, []);
  return snap;
}

export const realAccount = {
  async deposit(phone: string, amountKes: number) {
    const data = await fetchJson("/api/payments/mpesa/initiate", {
      method: "POST",
      body: JSON.stringify({ phone, amountKes }),
    });
    return data.checkoutRequestId as string;
  },
  /** Polls Safaricom-backed status until the deposit settles or times out. */
  async pollDeposit(checkoutRequestId: string, { intervalMs = 3000, timeoutMs = 90_000 } = {}) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const data = await fetchJson(`/api/payments/mpesa/status?checkoutRequestId=${encodeURIComponent(checkoutRequestId)}`);
      if (data.status === "completed" || data.status === "failed") {
        await refreshRealAccount();
        return data.status as "completed" | "failed";
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    return "pending" as const;
  },
  async allocate(slug: string) {
    await fetchJson("/api/real/allocate", { method: "POST", body: JSON.stringify({ slug }) });
    await refreshRealAccount();
  },
  async deallocate() {
    await fetchJson("/api/real/deallocate", { method: "POST" });
    await refreshRealAccount();
  },
};
