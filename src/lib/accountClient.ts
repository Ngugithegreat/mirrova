"use client";

import { useEffect, useSyncExternalStore } from "react";

export type AccountCopy = {
  slug: string;
  amountCents: number;
  stopLossPct: number;
  startedAt: string;
  currentValueCents: number;
};

export type AccountState = {
  ready: boolean;
  user: { name: string; email: string } | null;
  cashCents: number;
  copies: AccountCopy[];
  activity: { text: string; createdAt: string }[];
};

const EMPTY: AccountState = { ready: false, user: null, cashCents: 0, copies: [], activity: [] };

let state: AccountState = EMPTY;
const listeners = new Set<() => void>();

function setState(next: AccountState) {
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

export async function refreshAccount() {
  try {
    const data = await fetchJson("/api/account");
    setState({
      ready: true,
      user: data.user,
      cashCents: data.cashCents ?? 0,
      copies: data.copies ?? [],
      activity: data.activity ?? [],
    });
  } catch {
    setState({ ...EMPTY, ready: true });
  }
}

export function useAccountState(): AccountState {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    refreshAccount();
  }, []);
  return snap;
}

export const account = {
  async signUp(name: string, email: string, password: string) {
    await fetchJson("/api/auth/signup", { method: "POST", body: JSON.stringify({ name, email, password }) });
    await refreshAccount();
  },
  async logIn(email: string, password: string) {
    await fetchJson("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    await refreshAccount();
  },
  async logOut() {
    await fetchJson("/api/auth/logout", { method: "POST" });
    await refreshAccount();
  },
  async startCopy(slug: string, amountCents: number, stopLossPct: number) {
    await fetchJson("/api/copy/start", { method: "POST", body: JSON.stringify({ slug, amountCents, stopLossPct }) });
    await refreshAccount();
  },
  async stopCopy(slug: string) {
    await fetchJson("/api/copy/stop", { method: "POST", body: JSON.stringify({ slug }) });
    await refreshAccount();
  },
};
