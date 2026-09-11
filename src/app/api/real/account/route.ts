import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { getRealAccount } from "@/server/realAccount";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null });

  const { realCashCents, allocation, payments, tier, totalDepositedUsdCents, nextTier } = await getRealAccount(getDb(), user.id);

  return NextResponse.json({
    realCashCents,
    allocation: allocation
      ? {
          slug: allocation.traderSlug,
          amountCents: allocation.amountCents,
          startedAt: allocation.startedAt,
        }
      : null,
    payments: payments.map((p) => ({
      status: p.status,
      kesCents: p.kesCents,
      creditedUsdCents: p.creditedUsdCents,
      createdAt: p.createdAt,
      checkoutRequestId: p.checkoutRequestId,
    })),
    tier: { id: tier.id, name: tier.name, maxConcurrentCopies: tier.maxConcurrentCopies, feeDiscountPts: tier.feeDiscountPts },
    totalDepositedUsdCents,
    nextTier: nextTier ? { id: nextTier.id, name: nextTier.name, minDepositUsdCents: nextTier.minDepositUsdCents } : null,
  });
}
