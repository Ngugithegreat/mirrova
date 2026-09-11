export type TierId = "core" | "momentum" | "apex";

export type Tier = {
  id: TierId;
  name: string;
  /** Lifetime completed real deposits required to reach this tier. */
  minDepositUsdCents: number;
  maxConcurrentCopies: number;
  /** Percentage points shaved off a trader's listed performance fee. */
  feeDiscountPts: number;
  deskLeverage: number;
  deskInstrumentCount: number;
  deskOrdersWithSlTp: boolean;
  blurb: string;
};

export const TIERS: Tier[] = [
  {
    id: "core",
    name: "Core",
    minDepositUsdCents: 0,
    maxConcurrentCopies: 3,
    feeDiscountPts: 0,
    deskLeverage: 1,
    deskInstrumentCount: 4,
    deskOrdersWithSlTp: false,
    blurb: "Everyone starts here — free, no deposit required.",
  },
  {
    id: "momentum",
    name: "Momentum",
    minDepositUsdCents: 250 * 100,
    maxConcurrentCopies: 6,
    feeDiscountPts: 5,
    deskLeverage: 5,
    deskInstrumentCount: 8,
    deskOrdersWithSlTp: true,
    blurb: "Unlocked once your lifetime real deposits pass $250.",
  },
  {
    id: "apex",
    name: "Apex",
    minDepositUsdCents: 2500 * 100,
    maxConcurrentCopies: 999,
    feeDiscountPts: 10,
    deskLeverage: 20,
    deskInstrumentCount: 12,
    deskOrdersWithSlTp: true,
    blurb: "Unlocked once your lifetime real deposits pass $2,500.",
  },
];

export function tierForDeposits(totalCompletedDepositUsdCents: number): Tier {
  let current = TIERS[0];
  for (const t of TIERS) {
    if (totalCompletedDepositUsdCents >= t.minDepositUsdCents) current = t;
  }
  return current;
}

export function nextTier(tierId: TierId): Tier | null {
  const i = TIERS.findIndex((t) => t.id === tierId);
  return i >= 0 && i < TIERS.length - 1 ? TIERS[i + 1] : null;
}
