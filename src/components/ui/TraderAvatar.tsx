import { hashString } from "@/lib/prng";
import { cx } from "@/lib/format";

/** Editorial monogram plates — solid heritage tones, serif initials, square cut. */
const TONES = ["#1d5c3c", "#23629f", "#b3552b", "#7c3a66", "#5b5220", "#16150f"];

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
  const tone = TONES[hashString(name) % TONES.length];
  const sizes = {
    sm: "h-9 w-9 text-[11px]",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-lg",
    xl: "h-24 w-24 text-2xl",
  } as const;
  return (
    <div
      className={cx(
        "flex shrink-0 items-center justify-center rounded-[3px] font-display font-semibold text-[#f2efe6]",
        sizes[size],
        className
      )}
      style={{ background: tone }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
