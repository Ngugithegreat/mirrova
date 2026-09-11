"use client";

import { useSessionMode } from "@/lib/sessionMode";
import DemoOverview from "./DemoOverview";
import LiveOverview from "./LiveOverview";

export default function Overview() {
  const mode = useSessionMode();
  return mode === "real" ? <LiveOverview /> : <DemoOverview />;
}
