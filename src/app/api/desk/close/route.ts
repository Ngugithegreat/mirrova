import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { closePosition } from "@/server/desk";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const positionId = typeof body?.positionId === "string" ? body.positionId : "";

  const result = await closePosition(getDb(), user.id, positionId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, pnlCents: result.pnlCents });
}
