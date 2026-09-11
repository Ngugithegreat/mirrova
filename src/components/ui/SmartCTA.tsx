"use client";

import { ButtonLink } from "./Button";
import { useAccountState } from "@/lib/accountClient";

/** A primary CTA that already knows if you're signed in — no dead-end "Sign up"
 * prompts for someone who already has an account. */
export default function SmartCTA({
  signedOutLabel,
  signedInLabel = "Go to your account",
  size = "lg",
}: {
  signedOutLabel: string;
  signedInLabel?: string;
  size?: "sm" | "md" | "lg";
}) {
  const state = useAccountState();
  const signedIn = state.ready && !!state.user;

  return (
    <ButtonLink href={signedIn ? "/dashboard" : "/signup"} size={size}>
      {signedIn ? signedInLabel : signedOutLabel}
    </ButtonLink>
  );
}
