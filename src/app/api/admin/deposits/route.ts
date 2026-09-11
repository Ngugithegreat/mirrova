import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/server/adminAuth";
import { getDepositsList, reconcileDeposit, reconcileCryptoDeposit } from "@/server/admin";

export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const status = new URL(req.url).searchParams.get("status") ?? undefined;
  return NextResponse.json(await getDepositsList(getDb(), status));
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const method = body?.method === "crypto" ? "crypto" : "mpesa";
  const detail = typeof body?.detail === "string" ? body.detail : "";
  if (!detail) return NextResponse.json({ error: "Missing detail." }, { status: 400 });

  const result = method === "crypto" ? await reconcileCryptoDeposit(getDb(), detail) : await reconcileDeposit(getDb(), detail);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, status: result.status, creditedUsdCents: result.creditedUsdCents });
}
