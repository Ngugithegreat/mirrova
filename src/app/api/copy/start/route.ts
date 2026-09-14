import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { startCopy } from "@/server/account";
import { getTraderAny } from "@/server/providers";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug : "";
  const amountCents = Math.round(Number(body?.amountCents));
  const stopLossPct = Math.round(Number(body?.stopLossPct));

  const db = getDb();
  const trader = await getTraderAny(db, slug);
  if (!trader) return NextResponse.json({ error: "Unknown trader." }, { status: 400 });
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
  }
  if (!Number.isFinite(stopLossPct) || stopLossPct < 1 || stopLossPct > 90) {
    return NextResponse.json({ error: "Invalid stop-loss." }, { status: 400 });
  }

  const result = await startCopy(db, user.id, slug, amountCents, stopLossPct, trader.minCopy * 100);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
