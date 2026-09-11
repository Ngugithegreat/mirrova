import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { getPortfolio } from "@/server/account";
import { computeCopyValueCents } from "@/lib/copyValue";
import { unlockedDeskInstruments } from "@/lib/accountTypes";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null });

  const { copies, activity, accountType } = await getPortfolio(getDb(), user.id);

  return NextResponse.json({
    user: { name: user.name, email: user.email },
    cashCents: user.cashCents,
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
    activity: activity.map((a) => ({ text: a.text, createdAt: a.createdAt })),
  });
}
