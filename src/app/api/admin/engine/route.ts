import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/server/adminAuth";
import { getEngineAdminView, adminOpenPosition, adminClosePosition } from "@/server/copyEngine";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json(await getEngineAdminView(getDb()));
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const db = getDb();

  if (body?.action === "close") {
    const positionId = typeof body?.positionId === "string" ? body.positionId : "";
    if (!positionId) return NextResponse.json({ error: "Missing positionId." }, { status: 400 });
    const result = await adminClosePosition(db, positionId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  const traderSlug = typeof body?.traderSlug === "string" ? body.traderSlug : "";
  const instrument = typeof body?.instrument === "string" ? body.instrument : "";
  const side = body?.side === "short" ? "short" : "long";
  if (!traderSlug || !instrument) return NextResponse.json({ error: "Missing traderSlug or instrument." }, { status: 400 });
  const result = await adminOpenPosition(db, traderSlug, instrument, side);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
