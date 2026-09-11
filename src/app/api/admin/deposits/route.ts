import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/server/adminAuth";
import { getDepositsList, reconcileDeposit } from "@/server/admin";

export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const status = new URL(req.url).searchParams.get("status") ?? undefined;
  return NextResponse.json(await getDepositsList(getDb(), status));
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const checkoutRequestId = typeof body?.checkoutRequestId === "string" ? body.checkoutRequestId : "";
  if (!checkoutRequestId) return NextResponse.json({ error: "Missing checkoutRequestId." }, { status: 400 });

  const result = await reconcileDeposit(getDb(), checkoutRequestId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, status: result.status, creditedUsdCents: result.creditedUsdCents });
}
