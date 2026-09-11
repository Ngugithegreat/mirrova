"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/format";

export default function AccountSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();
  const isLive = pathname === "/wallet" || pathname.startsWith("/wallet/");

  return (
    <div className={cx("relative flex items-center rounded-full border border-line bg-raised/60 p-1", className)}>
      <span
        aria-hidden="true"
        className={cx(
          "absolute inset-y-1 left-1 w-[52px] rounded-full bg-gradient-to-r from-violet via-mint to-fuchsia transition-transform duration-200 ease-out",
          isLive ? "translate-x-0" : "translate-x-[56px]"
        )}
      />
      <Link
        href="/wallet"
        className={cx(
          "relative z-10 flex w-[52px] items-center justify-center gap-1 rounded-full py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
          isLive ? "text-[#06060c]" : "text-ink-2 hover:text-ink"
        )}
      >
        <span className={cx("h-1.5 w-1.5 rounded-full", isLive ? "bg-[#06060c]" : "bg-pos")} />
        Live
      </Link>
      <Link
        href="/dashboard"
        className={cx(
          "relative z-10 flex w-[52px] items-center justify-center rounded-full py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
          !isLive ? "text-[#06060c]" : "text-ink-2 hover:text-ink"
        )}
      >
        Demo
      </Link>
    </div>
  );
}
