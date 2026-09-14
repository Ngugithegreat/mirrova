import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/server/adminAuth";
import { getRiskPct, setRiskPct, getAutoBlowDays, setAutoBlowDays } from "@/server/settings";
import { forceRolloverAllTraders } from "@/server/copyEngine";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const db = getDb();
  return NextResponse.json({
    riskPct: await getRiskPct(db),
    autoBlowDays: await getAutoBlowDays(db),
  });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const db = getDb();

  if (body?.riskPct !== undefined) {
    const result = await setRiskPct(db, Number(body.riskPct));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  }
  if (body?.autoBlowDays !== undefined) {
    const result = await setAutoBlowDays(db, Number(body.autoBlowDays));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Apply immediately: close every currently-open illustrative position so
  // the next read opens a fresh one under the risk setting just saved,
  // instead of waiting up to 15 minutes for the natural bucket rollover.
  if (body?.riskPct !== undefined) {
    await forceRolloverAllTraders(db);
  }

  return NextResponse.json({
    ok: true,
    riskPct: await getRiskPct(db),
    autoBlowDays: await getAutoBlowDays(db),
  });
}
