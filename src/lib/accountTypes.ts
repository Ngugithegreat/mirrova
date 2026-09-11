import { INSTRUMENTS } from "./instruments";

export type AccountTypeId = "standard" | "ecn" | "pro" | "swapFree";

export type AccountType = {
  id: AccountTypeId;
  name: string;
  tagline: string;
  popular?: boolean;
  /** Display only — there's no live spread/commission engine here. */
  spreadFrom: string;
  commission: string;
  minDepositUsdCents: number;
  /** The "1:N" figure — also the Desk's real practice-leverage multiplier. */
  maxLeverage: number;
  maxConcurrentCopies: number;
  /** One-time practice grant at signup — never re-granted on a later switch. */
  demoCreditCents: number;
  deskInstrumentCount: number;
  excludeCrypto?: boolean;
  deskOrdersWithSlTp: boolean;
  highlights: string[];
};

export const ACCOUNT_TYPES: AccountType[] = [
  {
    id: "standard",
    name: "Standard",
    tagline: "Everything you need to start copying, nothing to pay up front.",
    popular: true,
    spreadFrom: "1.0 pip",
    commission: "Zero commission",
    minDepositUsdCents: 50 * 100,
    maxLeverage: 500,
    maxConcurrentCopies: 5,
    demoCreditCents: 10_000 * 100,
    deskInstrumentCount: 4,
    deskOrdersWithSlTp: false,
    highlights: [
      "Copy up to 5 strategy providers",
      "Market execution, no dealing desk",
      "Free deposits via M-Pesa",
      "$10,000 demo credit on signup",
    ],
  },
  {
    id: "ecn",
    name: "ECN",
    tagline: "Raw interbank-style pricing with a flat commission.",
    spreadFrom: "0.0 pips",
    commission: "$3.50 per lot per side",
    minDepositUsdCents: 500 * 100,
    maxLeverage: 400,
    maxConcurrentCopies: 20,
    demoCreditCents: 25_000 * 100,
    deskInstrumentCount: 8,
    deskOrdersWithSlTp: true,
    highlights: [
      "Copy up to 20 strategy providers",
      "Raw spreads, tighter fills",
      "Stop-loss & take-profit orders",
      "$25,000 demo credit on signup",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Institutional pricing and priority everything.",
    spreadFrom: "0.0 pips",
    commission: "$2.00 per lot per side",
    minDepositUsdCents: 5000 * 100,
    maxLeverage: 200,
    maxConcurrentCopies: 999,
    demoCreditCents: 100_000 * 100,
    deskInstrumentCount: 12,
    deskOrdersWithSlTp: true,
    highlights: [
      "Unlimited copy allocations",
      "Every instrument on the Desk",
      "Priority withdrawal processing",
      "$100,000 demo credit on signup",
    ],
  },
  {
    id: "swapFree",
    name: "Swap-Free",
    tagline: "No overnight interest on any position, ever.",
    spreadFrom: "1.2 pips",
    commission: "Zero commission",
    minDepositUsdCents: 100 * 100,
    maxLeverage: 400,
    maxConcurrentCopies: 10,
    demoCreditCents: 10_000 * 100,
    deskInstrumentCount: 10,
    excludeCrypto: true,
    deskOrdersWithSlTp: true,
    highlights: [
      "Copy up to 10 strategy providers",
      "No swap or rollover charges",
      "Every instrument except crypto",
      "$10,000 demo credit on signup",
    ],
  },
];

const CRYPTO_SYMS = new Set(["BTC/USD", "ETH/USD"]);

export function getAccountType(id: string | null | undefined): AccountType {
  return ACCOUNT_TYPES.find((t) => t.id === id) ?? ACCOUNT_TYPES[0];
}

export function isAccountTypeId(id: string): id is AccountTypeId {
  return ACCOUNT_TYPES.some((t) => t.id === id);
}

export function unlockedDeskInstruments(type: AccountType): string[] {
  const pool = type.excludeCrypto ? INSTRUMENTS.filter((i) => !CRYPTO_SYMS.has(i.sym)) : INSTRUMENTS;
  return pool.slice(0, type.deskInstrumentCount).map((i) => i.sym);
}
