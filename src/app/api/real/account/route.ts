import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { getRealAccount } from "@/server/realAccount";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null });

  const { realCashCents, allocation, payments, withdrawals, accountType, totalDepositedUsdCents, eligibleAccountTypes } = await getRealAccount(
    getDb(),
    user.id
  );

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
    withdrawals: withdrawals.map((w) => ({
      id: w.id,
      amountUsdCents: w.amountUsdCents,
      status: w.status,
      requestedAt: w.requestedAt,
      note: w.note,
    })),
    accountType: {
      id: accountType.id,
      name: accountType.name,
      minDepositUsdCents: accountType.minDepositUsdCents,
      maxLeverage: accountType.maxLeverage,
      maxConcurrentCopies: accountType.maxConcurrentCopies,
    },
    totalDepositedUsdCents,
    eligibleAccountTypes,
  });
}
