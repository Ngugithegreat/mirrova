"use client";

import { useEffect, useState } from "react";
import WorldNetwork from "@/components/motion/WorldNetwork";
import CountUp from "@/components/motion/CountUp";
import Reveal from "@/components/ui/Reveal";
import { PLATFORM_STATS, TOP_TRADERS } from "@/lib/traders";

// City paired with its real country + flag — deliberately not two independent
// random picks, which produced nonsense like "Mumbai, Australia."
const PLACES: { city: string; country: string; flag: string }[] = [
  { city: "Nairobi", country: "Kenya", flag: "🇰🇪" },
  { city: "Lagos", country: "Nigeria", flag: "🇳🇬" },
  { city: "Cairo", country: "Egypt", flag: "🇪🇬" },
  { city: "Johannesburg", country: "South Africa", flag: "🇿🇦" },
  { city: "Accra", country: "Ghana", flag: "🇬🇭" },
  { city: "Dubai", country: "UAE", flag: "🇦🇪" },
  { city: "Mumbai", country: "India", flag: "🇮🇳" },
  { city: "Singapore", country: "Singapore", flag: "🇸🇬" },
  { city: "Manila", country: "Philippines", flag: "🇵🇭" },
  { city: "Jakarta", country: "Indonesia", flag: "🇮🇩" },
  { city: "London", country: "United Kingdom", flag: "🇬🇧" },
  { city: "Berlin", country: "Germany", flag: "🇩🇪" },
  { city: "Madrid", country: "Spain", flag: "🇪🇸" },
  { city: "Warsaw", country: "Poland", flag: "🇵🇱" },
  { city: "São Paulo", country: "Brazil", flag: "🇧🇷" },
  { city: "Mexico City", country: "Mexico", flag: "🇲🇽" },
  { city: "Toronto", country: "Canada", flag: "🇨🇦" },
  { city: "Sydney", country: "Australia", flag: "🇦🇺" },
  { city: "Seoul", country: "South Korea", flag: "🇰🇷" },
  { city: "Tokyo", country: "Japan", flag: "🇯🇵" },
];

function makeCaption() {
  const place = PLACES[Math.floor(Math.random() * PLACES.length)];
  const trader = TOP_TRADERS[Math.floor(Math.random() * TOP_TRADERS.length)];
  return `${place.flag} Someone in ${place.city}, ${place.country} just copied ${trader.name}`;
}

export default function GlobalReach() {
  const [caption, setCaption] = useState<string | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCaption(makeCaption());
      return;
    }
    setCaption(makeCaption());
    const id = setInterval(() => setCaption(makeCaption()), 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden border-y border-line-soft bg-surface/30 py-20 lg:py-28">
      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Global reach</p>
          <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-[2.75rem] sm:leading-[1.1]">
            Wherever you are, someone is already copying
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-2">
            Asport Traders runs across {PLATFORM_STATS.countries}+ countries — the same vetted register,
            the same risk controls, the same execution, no matter which market you deposit from.
          </p>
        </Reveal>

        <div className="relative mx-auto mt-14 h-[340px] max-w-4xl sm:h-[420px]">
          <WorldNetwork />
          {caption && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 w-[92%] max-w-md -translate-x-1/2 rounded-full border border-line bg-raised/80 px-4 py-2.5 text-center text-xs text-ink-2 backdrop-blur-md sm:text-sm">
              {caption}
            </div>
          )}
        </div>

        <div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-line-soft pt-8 text-center">
          <div>
            <div className="fig text-2xl font-semibold text-ink sm:text-3xl">
              <CountUp value={PLATFORM_STATS.countries} format="plain" />+
            </div>
            <div className="mt-1 text-xs text-ink-3">countries</div>
          </div>
          <div>
            <div className="fig text-2xl font-semibold text-ink sm:text-3xl">
              <CountUp value={PLATFORM_STATS.copiers} format="count" />
            </div>
            <div className="mt-1 text-xs text-ink-3">active copiers</div>
          </div>
          <div>
            <div className="fig text-2xl font-semibold text-ink sm:text-3xl">
              <CountUp value={PLATFORM_STATS.aum} format="money-compact" />
            </div>
            <div className="mt-1 text-xs text-ink-3">under copy</div>
          </div>
        </div>
      </div>
    </section>
  );
}
