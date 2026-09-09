import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { handleStkCallback, reconcileDeposit } from "@/server/realAccount";
import { parseStkCallback } from "@/server/mpesa";

/** Safaricom posts here directly — no session, this is the callback URL
 * registered with Daraja. Always return 200 quickly so Safaricom doesn't
 * retry; the actual settlement is idempotent via completeDeposit. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = parseStkCallback(body);

  if (parsed) {
    const db = getDb();
    await handleStkCallback(db, parsed.checkoutRequestId, parsed.resultCode, parsed.resultDesc, parsed.mpesaReceipt);
    // The callback alone is known to be unreliable; also ask Safaricom
    // directly so a dropped/garbled callback never leaves a deposit stuck.
    await reconcileDeposit(db, parsed.checkoutRequestId).catch(() => {});
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
