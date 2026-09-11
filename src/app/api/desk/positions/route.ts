import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { listPositions } from "@/server/desk";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { open, closed } = await listPositions(getDb(), user.id);

  return NextResponse.json({
    open: open.map(({ position: p, price, unrealizedPnlCents }) => ({
      id: p.id,
      instrument: p.instrument,
      side: p.side,
      stakeUsdCents: p.stakeUsdCents,
      leverage: p.leverage,
      entryPrice: p.entryPrice,
      stopLossPrice: p.stopLossPrice,
      takeProfitPrice: p.takeProfitPrice,
      openedAt: p.openedAt,
      price,
      unrealizedPnlCents,
    })),
    closed: closed.map((p) => ({
      id: p.id,
      instrument: p.instrument,
      side: p.side,
      stakeUsdCents: p.stakeUsdCents,
      leverage: p.leverage,
      entryPrice: p.entryPrice,
      closePrice: p.closePrice,
      pnlCents: p.pnlCents,
      closedAt: p.closedAt,
    })),
  });
}
