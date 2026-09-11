import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { openPosition } from "@/server/desk";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const instrument = typeof body?.instrument === "string" ? body.instrument : "";
  const side = body?.side === "short" ? "short" : body?.side === "long" ? "long" : null;
  const stakeUsdCents = Math.round(Number(body?.stakeUsdCents));
  const stopLossPrice = Number.isFinite(Number(body?.stopLossPrice)) && body?.stopLossPrice != null ? Number(body.stopLossPrice) : undefined;
  const takeProfitPrice = Number.isFinite(Number(body?.takeProfitPrice)) && body?.takeProfitPrice != null ? Number(body.takeProfitPrice) : undefined;

  if (!side) return NextResponse.json({ error: "Invalid side." }, { status: 400 });
  if (!Number.isFinite(stakeUsdCents) || stakeUsdCents <= 0) {
    return NextResponse.json({ error: "Invalid stake." }, { status: 400 });
  }

  const result = await openPosition(getDb(), user.id, instrument, side, stakeUsdCents, stopLossPrice, takeProfitPrice);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
