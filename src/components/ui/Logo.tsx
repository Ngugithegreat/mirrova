import Link from "next/link";
import { cx } from "@/lib/format";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="lgm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="55%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#e879f9" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="rgba(139,92,246,0.1)" stroke="url(#lgm)" strokeWidth="1.5" />
      <path
        d="M10 28 V15 l6 8 4 -11 4 11 6 -8 v13"
        fill="none"
        stroke="url(#lgm)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cx("group flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-[1.35rem] font-semibold tracking-tight text-ink">
        mirrova
      </span>
    </Link>
  );
}
