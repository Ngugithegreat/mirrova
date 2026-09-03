"use client";

import { useEffect, useState } from "react";
import TraderAvatar from "@/components/ui/TraderAvatar";
import { TOP_TRADERS } from "@/lib/traders";

const COPIERS = ["Rebecca", "Samuel", "Aisha", "Tom", "Ines", "Kwame", "Laura", "Yusuf", "Marta", "Chen", "Priya", "Olu"];
const AMOUNTS = [250, 400, 500, 750, 1000, 1200, 1500, 2000, 2500, 5000];

type Entry = { id: number; who: string; trader: string; amount: number };

function makeEntry(id: number): Entry {
  return {
    id,
    who: COPIERS[Math.floor(Math.random() * COPIERS.length)],
    trader: TOP_TRADERS[Math.floor(Math.random() * TOP_TRADERS.length)].name,
    amount: AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)],
  };
}

/** A live-cycling "someone just copied" feed. Client-only to avoid hydration drift. */
export default function ActivityFeed() {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setEntries([makeEntry(0), makeEntry(1), makeEntry(2)]);
      return;
    }
    let n = 0;
    setEntries([makeEntry(n++)]);
    const id = setInterval(() => {
      setEntries((prev) => [makeEntry(n++), ...prev].slice(0, 3));
    }, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-2" aria-hidden="true">
      {entries.map((e, i) => (
        <div
          key={e.id}
          className={`flex items-center gap-2.5 rounded-lg border border-line bg-raised/70 px-3 py-2 backdrop-blur-md ${i === 0 ? "feed-in" : ""}`}
          style={{ opacity: 1 - i * 0.28 }}
        >
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="absolute h-full w-full animate-ping rounded-full bg-pos opacity-60" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-pos" />
          </span>
          <TraderAvatar name={e.trader} size="sm" className="!h-6 !w-6 !text-[8px]" />
          <p className="truncate text-xs text-ink-2">
            <span className="font-medium text-ink">{e.who}</span> copied{" "}
            <span className="font-medium text-ink">{e.trader.split(" ")[0]}</span>
            <span className="tnum text-mint"> · ${e.amount.toLocaleString()}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
