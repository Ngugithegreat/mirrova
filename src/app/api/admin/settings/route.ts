import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/server/adminAuth";
import { getWinRatePct, setWinRatePct, getRiskPct, setRiskPct } from "@/server/settings";
import { forceRolloverAllTraders } from "@/server/copyEngine";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const db = getDb();
  return NextResponse.json({ winRatePct: await getWinRatePct(db), riskPct: await getRiskPct(db) });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const db = getDb();

  if (body?.winRatePct !== undefined) {
    const result = await setWinRatePct(db, Number(body.winRatePct));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  }
  if (body?.riskPct !== undefined) {
    const result = await setRiskPct(db, Number(body.riskPct));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Apply immediately: close every currently-open illustrative position so
  // the next read opens a fresh one under the settings just saved, instead
  // of waiting up to 15 minutes for the natural bucket rollover.
  if (body?.winRatePct !== undefined || body?.riskPct !== undefined) {
    await forceRolloverAllTraders(db);
  }

  return NextResponse.json({ ok: true, winRatePct: await getWinRatePct(db), riskPct: await getRiskPct(db) });
}
