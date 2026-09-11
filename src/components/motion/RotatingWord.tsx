"use client";

import { useEffect, useState } from "react";
import { cx } from "@/lib/format";

const WORDS = ["Automatically.", "Effortlessly.", "Instantly.", "Risk-managed.", "Hands-free."];
const HOLD_MS = 2600;
const TRANSITION_MS = 320;

export default function RotatingWord() {
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);
  const [reduceMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (reduceMotion) {
      const id = setTimeout(() => setI((v) => (v + 1) % WORDS.length), HOLD_MS);
      return () => clearTimeout(id);
    }
    const fadeOut = setTimeout(() => setVisible(false), HOLD_MS - TRANSITION_MS);
    const swap = setTimeout(() => {
      setI((v) => (v + 1) % WORDS.length);
      setVisible(true);
    }, HOLD_MS);
    return () => {
      clearTimeout(fadeOut);
      clearTimeout(swap);
    };
  }, [i, reduceMotion]);

  return (
    <span
      className={cx(
        "text-aurora inline-block",
        !reduceMotion && "transition-all duration-300 ease-out",
        !reduceMotion && !visible && "-translate-y-1.5 opacity-0"
      )}
    >
      {WORDS[i]}
    </span>
  );
}
