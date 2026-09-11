import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/session";
import { checkMpesaCredentials } from "@/server/mpesa";

const REQUIRED_VARS = [
  "MPESA_ENVIRONMENT",
  "MPESA_CONSUMER_KEY",
  "MPESA_CONSUMER_SECRET",
  "MPESA_PASSKEY",
  "MPESA_SHORTCODE",
  "MPESA_TILL_NUMBER",
  "MPESA_TRANSACTION_TYPE",
  "MPESA_CALLBACK_URL",
] as const;

/** Diagnostic only: confirms config is present and OAuth succeeds. Never
 * sends an STK push, never contacts a phone, never returns secret values. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const config = Object.fromEntries(REQUIRED_VARS.map((k) => [k, !!process.env[k]]));
  const missing = REQUIRED_VARS.filter((k) => !process.env[k]);

  if (missing.length > 0) {
    return NextResponse.json({ ok: false, config, error: `Missing: ${missing.join(", ")}` });
  }

  const auth = await checkMpesaCredentials();
  return NextResponse.json({ ok: auth.ok, config, error: "error" in auth ? auth.error : undefined });
}
