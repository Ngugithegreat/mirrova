import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/server/adminAuth";
import { grantBonus } from "@/server/realAccount";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const amountUsd = Number(body?.amountUsd);
  const note = typeof body?.note === "string" && body.note ? body.note : undefined;

  const result = await grantBonus(getDb(), id, Math.round(amountUsd * 100), note);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
