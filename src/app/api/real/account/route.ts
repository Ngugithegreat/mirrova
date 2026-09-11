import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { getRealAccount } from "@/server/realAccount";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null });

  const {
    realCashCents,
    allocation,
    payments,
    cryptoPayments,
    withdrawals,
    accountType,
    totalDepositedUsdCents,
    eligibleAccountTypes,
  } = await getRealAccount(getDb(), user.id);

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
      method: "mpesa" as const,
      status: p.status,
      displayAmount: `KES ${(p.kesCents / 100).toLocaleString()}`,
      creditedUsdCents: p.creditedUsdCents,
      createdAt: p.createdAt,
    })),
    cryptoPayments: cryptoPayments.map((p) => ({
      method: "crypto" as const,
      status: p.status,
      displayAmount: `$${p.priceAmountUsd.toLocaleString()} (${p.payCurrency})`,
      creditedUsdCents: p.creditedUsdCents,
      createdAt: p.createdAt,
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
