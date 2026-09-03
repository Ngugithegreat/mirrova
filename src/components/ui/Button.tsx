import Link from "next/link";
import { cx } from "@/lib/format";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "sheen bg-gradient-to-r from-violet via-mint to-fuchsia bg-[length:200%_100%] bg-left text-[#06060c] font-semibold hover:bg-right shadow-[0_6px_30px_-8px_rgba(139,92,246,0.6)] hover:shadow-[0_8px_40px_-8px_rgba(34,211,238,0.6)] transition-[background-position,box-shadow] duration-500",
  secondary:
    "border border-line bg-raised/50 text-ink backdrop-blur-sm hover:border-mint/50 hover:bg-raised",
  ghost: "text-ink-2 hover:text-ink hover:bg-raised/60",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-[13px]",
  md: "px-5 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-[15px]",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: CommonProps & { href: string }) {
  return (
    <Link href={href} className={cx(base, variants[variant], sizes[size], className)}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cx(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}
