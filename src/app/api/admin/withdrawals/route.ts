import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/server/adminAuth";
import { getWithdrawalsList, markWithdrawalPaid, rejectWithdrawal } from "@/server/admin";

export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const status = new URL(req.url).searchParams.get("status") ?? undefined;
  return NextResponse.json(await getWithdrawalsList(getDb(), status));
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const action = body?.action === "pay" ? "pay" : body?.action === "reject" ? "reject" : "";
  const note = typeof body?.note === "string" ? body.note : undefined;
  if (!id || !action) return NextResponse.json({ error: "Missing id or action." }, { status: 400 });

  const result = action === "pay" ? await markWithdrawalPaid(getDb(), id, note) : await rejectWithdrawal(getDb(), id, note);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
