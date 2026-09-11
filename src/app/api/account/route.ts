import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { getPortfolio } from "@/server/account";
import { computeCopyValueCents } from "@/lib/copyValue";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null });

  const { copies, activity, tier } = await getPortfolio(getDb(), user.id);

  return NextResponse.json({
    user: { name: user.name, email: user.email },
    cashCents: user.cashCents,
    tier: {
      id: tier.id,
      name: tier.name,
      maxConcurrentCopies: tier.maxConcurrentCopies,
      feeDiscountPts: tier.feeDiscountPts,
      deskInstrumentCount: tier.deskInstrumentCount,
      deskLeverage: tier.deskLeverage,
      deskOrdersWithSlTp: tier.deskOrdersWithSlTp,
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
