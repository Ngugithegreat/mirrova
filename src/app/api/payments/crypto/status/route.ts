import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { reconcileCryptoDeposit } from "@/server/cryptoDeposits";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const providerPaymentId = new URL(req.url).searchParams.get("providerPaymentId") ?? "";
  if (!providerPaymentId) return NextResponse.json({ error: "Missing providerPaymentId." }, { status: 400 });

  const result = await reconcileCryptoDeposit(getDb(), providerPaymentId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, status: result.status, creditedUsdCents: result.creditedUsdCents });
}
