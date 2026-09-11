import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/session";
import { checkNowPaymentsCredentials } from "@/server/nowpayments";

const REQUIRED_VARS = ["NOWPAYMENTS_API_KEY", "NOWPAYMENTS_IPN_SECRET"] as const;

/** Diagnostic only: confirms config is present and the API key works. Never
 * creates a payment, never returns secret values. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const config = Object.fromEntries(REQUIRED_VARS.map((k) => [k, !!process.env[k]]));
  const missing = REQUIRED_VARS.filter((k) => !process.env[k]);

  if (missing.length > 0) {
    return NextResponse.json({ ok: false, config, error: `Missing: ${missing.join(", ")}` });
  }

  const auth = await checkNowPaymentsCredentials();
  return NextResponse.json({ ok: auth.ok, config, error: "error" in auth ? auth.error : undefined });
}
