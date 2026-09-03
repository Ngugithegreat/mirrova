import Link from "next/link";
import { cx } from "@/lib/format";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[3px] font-medium tracking-wide transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-[#f2efe6] hover:bg-mint",
  secondary: "border border-ink/40 bg-transparent text-ink hover:border-ink hover:bg-ink/4",
  ghost: "text-ink-2 hover:text-ink underline-offset-4 hover:underline",
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
