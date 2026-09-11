import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { getPortfolio, updateName } from "@/server/account";
import { computeCopyValueCents } from "@/lib/copyValue";
import { unlockedDeskInstruments } from "@/lib/accountTypes";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null });

  const { copies, closedCopies, activity, accountType } = await getPortfolio(getDb(), user.id);

  return NextResponse.json({
    user: { name: user.name, email: user.email },
    cashCents: user.cashCents,
    notifyProductUpdates: user.notifyProductUpdates,
    notifySignalAlerts: user.notifySignalAlerts,
    accountType: {
      id: accountType.id,
      name: accountType.name,
      maxConcurrentCopies: accountType.maxConcurrentCopies,
      maxLeverage: accountType.maxLeverage,
      deskOrdersWithSlTp: accountType.deskOrdersWithSlTp,
      deskInstruments: unlockedDeskInstruments(accountType),
    },
    copies: copies.map((c) => ({
      slug: c.traderSlug,
      amountCents: c.amountCents,
      stopLossPct: c.stopLossPct,
      startedAt: c.startedAt,
      currentValueCents: computeCopyValueCents({
        slug: c.traderSlug,
        amountCents: c.amountCents,
        stopLossPct: c.stopLossPct,
        startedAt: c.startedAt,
      }),
    })),
    closedCopies: closedCopies.map((c) => ({
      slug: c.traderSlug,
      amountCents: c.amountCents,
      valueCents: c.valueCents ?? c.amountCents,
      pnlCents: c.pnlCents ?? 0,
      startedAt: c.startedAt,
      stoppedAt: c.stoppedAt,
    })),
    activity: activity.map((a) => ({ text: a.text, createdAt: a.createdAt })),
  });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";
  const result = await updateName(getDb(), user.id, name);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
