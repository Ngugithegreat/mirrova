"use client";

import { useEffect, useSyncExternalStore } from "react";

export type DeskOpenPosition = {
  id: string;
  instrument: string;
  side: "long" | "short";
  stakeUsdCents: number;
  leverage: number;
  entryPrice: number;
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
  openedAt: string;
  price: number;
  unrealizedPnlCents: number;
};

export type DeskClosedPosition = {
  id: string;
  instrument: string;
  side: "long" | "short";
  stakeUsdCents: number;
  leverage: number;
  entryPrice: number;
  closePrice: number | null;
  pnlCents: number | null;
  closedAt: string | null;
};

export type DeskState = {
  ready: boolean;
  open: DeskOpenPosition[];
  closed: DeskClosedPosition[];
};

const EMPTY: DeskState = { ready: false, open: [], closed: [] };

let state: DeskState = EMPTY;
const listeners = new Set<() => void>();

function setState(next: DeskState) {
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

export async function refreshDesk() {
  try {
    const data = await fetchJson("/api/desk/positions");
    setState({ ready: true, open: data.open ?? [], closed: data.closed ?? [] });
  } catch {
    setState({ ...EMPTY, ready: true });
  }
}

export function useDeskState(): DeskState {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    refreshDesk();
    const id = setInterval(refreshDesk, 15_000);
    return () => clearInterval(id);
  }, []);
  return snap;
}

export const desk = {
  async open(instrument: string, side: "long" | "short", stakeUsdCents: number, stopLossPrice?: number, takeProfitPrice?: number) {
    await fetchJson("/api/desk/open", {
      method: "POST",
      body: JSON.stringify({ instrument, side, stakeUsdCents, stopLossPrice, takeProfitPrice }),
    });
    await refreshDesk();
  },
  async close(positionId: string) {
    await fetchJson("/api/desk/close", { method: "POST", body: JSON.stringify({ positionId }) });
    await refreshDesk();
  },
};
