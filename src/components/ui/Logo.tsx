import Link from "next/link";
import { cx } from "@/lib/format";

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3ce3a7" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="rgba(60,227,167,0.08)" stroke="url(#lg)" strokeWidth="1.5" />
      <path
        d="M10 28 V15 l6 8 4 -11 4 11 6 -8 v13"
        fill="none"
        stroke="url(#lg)"
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
