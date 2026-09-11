import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { initiateCryptoDeposit } from "@/server/cryptoDeposits";
import { getSiteUrl } from "@/lib/site";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const amountUsd = Number(body?.amountUsd);

  const callbackUrl = `${getSiteUrl()}/api/payments/crypto/callback`;
  const result = await initiateCryptoDeposit(getDb(), user.id, amountUsd, callbackUrl);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({
    ok: true,
    providerPaymentId: result.providerPaymentId,
    payAddress: result.payAddress,
    payCurrency: result.payCurrency,
  });
}
