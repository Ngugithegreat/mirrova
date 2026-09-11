import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/server/adminAuth";
import { reviewKyc } from "@/server/kyc";

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const decision = body?.decision === "verified" ? "verified" : body?.decision === "rejected" ? "rejected" : "";
  const note = typeof body?.note === "string" ? body.note : undefined;
  if (!userId || !decision) return NextResponse.json({ error: "Missing userId or decision." }, { status: 400 });

  const result = await reviewKyc(getDb(), userId, decision, note);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
