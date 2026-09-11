import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { handleCryptoIpn } from "@/server/cryptoDeposits";
import { verifyIpnSignature } from "@/server/nowpayments";

/** NOWPayments posts here directly — no session, this is the IPN callback
 * URL registered with the payment. Signature-verified before anything is
 * trusted; settlement is idempotent via completeCryptoDeposit. */
export async function POST(req: Request) {
  const raw = await req.text();
  const body = JSON.parse(raw || "{}");
  const sig = req.headers.get("x-nowpayments-sig");

  if (verifyIpnSignature(body, sig) && body.payment_id) {
    await handleCryptoIpn(getDb(), String(body.payment_id), String(body.payment_status ?? ""), Number(body.price_amount ?? undefined));
  }

  return NextResponse.json({ ok: true });
}
