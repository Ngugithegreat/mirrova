"use client";

import { ButtonLink } from "./Button";
import { useAccountState } from "@/lib/accountClient";

/** "Copy traders" is now a gated page — a logged-out visitor clicking one of
 * these lands on /signup instead of bouncing through the login gate. */
export default function TradersLink({
  variant = "secondary",
  size = "lg",
  className,
  children,
}: {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}) {
  const state = useAccountState();
  const signedIn = state.ready && !!state.user;
  return (
    <ButtonLink href={signedIn ? "/traders" : "/signup"} variant={variant} size={size} className={className}>
      {children}
    </ButtonLink>
  );
}
