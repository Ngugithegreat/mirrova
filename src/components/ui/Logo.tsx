import Link from "next/link";
import { cx } from "@/lib/format";

export function LogoMark({ className = "h-9 w-9", onDark = false }: { className?: string; onDark?: boolean }) {
  const frame = onDark ? "#f2efe6" : "#16150f";
  const line = onDark ? "#7fc9a4" : "#1d5c3c";
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect x="1.5" y="1.5" width="37" height="37" fill="none" stroke={frame} strokeWidth="1.5" />
      <rect x="4.5" y="4.5" width="31" height="31" fill="none" stroke={frame} strokeWidth="0.75" opacity="0.45" />
      <path
        d="M11 27 V16 l4.7 6.5 4.3 -9 4.3 9 4.7 -6.5 v11"
        fill="none"
        stroke={line}
        strokeWidth="2.4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export default function Logo({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <Link href="/" className={cx("group flex items-center gap-3", className)}>
      <LogoMark onDark={onDark} />
      <span
        className={cx(
          "font-display text-[1.45rem] font-semibold tracking-tight",
          onDark ? "text-[#f2efe6]" : "text-ink"
        )}
      >
        Mirrova<span className="text-mint">.</span>
      </span>
    </Link>
  );
}
