"use client";

import { useSessionMode } from "@/lib/sessionMode";
import Portfolio from "./Portfolio";
import LiveOverview from "./LiveOverview";

export default function Overview() {
  const mode = useSessionMode();
  return mode === "real" ? <LiveOverview /> : <Portfolio />;
}
