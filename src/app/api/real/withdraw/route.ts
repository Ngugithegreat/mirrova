import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { requestWithdrawal } from "@/server/withdrawals";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const phone = typeof body?.phone === "string" ? body.phone : "";
  const amountUsdCents = Math.round(Number(body?.amountUsdCents));

  if (!Number.isFinite(amountUsdCents) || amountUsdCents <= 0) {
    return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
  }

  const result = await requestWithdrawal(getDb(), user.id, amountUsdCents, phone);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
