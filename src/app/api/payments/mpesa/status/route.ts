import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { reconcileDeposit } from "@/server/realAccount";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const checkoutRequestId = new URL(req.url).searchParams.get("checkoutRequestId") ?? "";
  if (!checkoutRequestId) return NextResponse.json({ error: "Missing checkoutRequestId." }, { status: 400 });

  const result = await reconcileDeposit(getDb(), checkoutRequestId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, status: result.status, creditedUsdCents: result.creditedUsdCents });
}
