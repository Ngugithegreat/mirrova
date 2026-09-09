import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { initiateDeposit } from "@/server/realAccount";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const phone = typeof body?.phone === "string" ? body.phone : "";
  const amountKes = Number(body?.amountKes);

  const result = await initiateDeposit(getDb(), user.id, phone, amountKes);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, checkoutRequestId: result.checkoutRequestId });
}
