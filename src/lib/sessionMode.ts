"use client";

import { useSyncExternalStore } from "react";

export type SessionMode = "real" | "demo";

const STORAGE_KEY = "asport.sessionMode";

let mode: SessionMode = "demo";
let hydrated = false;
const listeners = new Set<() => void>();

function readStored(): SessionMode {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "real" ? "real" : "demo";
  } catch {
    return "demo";
  }
}

export function setSessionMode(next: SessionMode) {
  mode = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore — a private browsing context or blocked storage just won't persist the choice
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): SessionMode {
  if (!hydrated) {
    mode = readStored();
    hydrated = true;
  }
  return mode;
}

function getServerSnapshot(): SessionMode {
  return "demo";
}

/** Real vs Demo is app state, not a route — matches PrimeStone's model where
 * switching modes changes what Overview/the topbar show, while Wallet stays
 * a separate, always-reachable page regardless of mode. */
export function useSessionMode(): SessionMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
