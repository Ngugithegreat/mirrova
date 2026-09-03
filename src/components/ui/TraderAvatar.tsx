import { hashString } from "@/lib/prng";
import { cx } from "@/lib/format";

const PALETTES = [
  ["#8b5cf6", "#22d3ee"],
  ["#22d3ee", "#34d399"],
  ["#e879f9", "#8b5cf6"],
  ["#f59e0b", "#e879f9"],
  ["#34d399", "#3987e5"],
  ["#3987e5", "#8b5cf6"],
];

export default function TraderAvatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const [c1, c2] = PALETTES[hashString(name) % PALETTES.length];
  const sizes = {
    sm: "h-9 w-9 text-[11px]",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-lg",
    xl: "h-24 w-24 text-2xl",
  } as const;
  return (
    <div
      className={cx(
        "flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-[#06060c] ring-2 ring-white/10",
        sizes[size],
        className
      )}
      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
