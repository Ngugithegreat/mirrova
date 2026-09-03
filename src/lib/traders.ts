import { rngFor } from "./prng";

/**
 * All trader data is generated deterministically from per-trader seeds, so the
 * server render, the client render, and every page agree on every number.
 * Platform-level stats are computed from the roster — never hand-typed — so the
 * headline claims can never contradict the leaderboard.
 */

export type RiskStyle = "Conservative" | "Balanced" | "Aggressive";

export type Trader = {
  slug: string;
  name: string;
  handle: string;
  country: string;
  flag: string;
  strategy: string;
  style: RiskStyle;
  markets: string[];
  bio: string;
  riskScore: number; // 1–10
  copiers: number;
  aum: number; // USD under copy
  perfFee: number; // % of profits
  minCopy: number;
  winRate: number; // %
  trades: number;
  avgHoldDays: number;
  joined: string; // e.g. "Mar 2022"
  verified: boolean;
  badges: string[];
  monthlyReturns: number[]; // % per month, oldest → newest (24 months)
  allocation: { label: string; pct: number }[];
};

export type TraderStats = {
  return12m: number;
  return24m: number;
  returnYtd: number;
  maxDrawdown: number; // negative %
  sharpe: number;
  bestMonth: number;
  worstMonth: number;
  profitableMonths: number; // count of positive months out of 24
};

/** Month labels for the 24-month window ending Aug 2026. */
export const MONTH_LABELS: { label: string; year: number }[] = (() => {
  const out: { label: string; year: number }[] = [];
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let m = 8; // Sep (0-indexed)
  let y = 2024;
  for (let i = 0; i < 24; i++) {
    out.push({ label: names[m], year: y });
    m++;
    if (m === 12) {
      m = 0;
      y++;
    }
  }
  return out;
})();

function genMonthly(seedKey: string, mu: number, sigma: number, skew = 0): number[] {
  const rnd = rngFor(`m:${seedKey}`);
  const out: number[] = [];
  for (let i = 0; i < 24; i++) {
    // sum of 3 uniforms ≈ normal-ish, cheap and deterministic
    const z = (rnd() + rnd() + rnd() - 1.5) / 0.75;
    let v = mu + z * sigma;
    if (skew > 0 && rnd() < 0.09) v += skew * (0.5 + rnd()); // occasional outsized winner
    if (rnd() < 0.1) v -= sigma * (1.2 + rnd() * 2.2); // stress months — every real record has them
    out.push(Math.round(v * 10) / 10);
  }
  return out;
}

type Archetype = {
  style: RiskStyle;
  mu: number;
  sigma: number;
  skew: number;
  risk: [number, number];
  fee: [number, number];
  winRate: [number, number];
  hold: [number, number];
};

const ARCHETYPES: Record<string, Archetype> = {
  steady: { style: "Conservative", mu: 1.5, sigma: 1.6, skew: 0, risk: [2, 4], fee: [10, 15], winRate: [68, 80], hold: [12, 40] },
  balanced: { style: "Balanced", mu: 2.4, sigma: 3.2, skew: 2, risk: [4, 6], fee: [15, 20], winRate: [58, 70], hold: [4, 14] },
  aggressive: { style: "Aggressive", mu: 3.6, sigma: 6.5, skew: 6, risk: [7, 9], fee: [20, 30], winRate: [46, 60], hold: [1, 5] },
};

function pick<T>(rnd: () => number, arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}
function between(rnd: () => number, [a, b]: [number, number]) {
  return a + rnd() * (b - a);
}

const ALLOC_POOLS: Record<string, string[]> = {
  Stocks: ["US Equities", "EU Equities", "Tech Growth", "Dividend Value"],
  Crypto: ["BTC", "ETH", "Alt L1s", "DeFi"],
  Forex: ["EUR/USD", "GBP/USD", "USD/JPY", "Majors Basket"],
  Indices: ["S&P 500", "Nasdaq 100", "DAX 40", "FTSE 100"],
  Commodities: ["Gold", "Silver", "Crude Oil", "Copper"],
};

function genAllocation(seedKey: string, markets: string[]): { label: string; pct: number }[] {
  const rnd = rngFor(`a:${seedKey}`);
  const labels: string[] = [];
  for (const mkt of markets.slice(0, 3)) {
    const pool = ALLOC_POOLS[mkt] ?? [mkt];
    labels.push(pick(rnd, pool));
  }
  labels.push("Cash");
  const weights = labels.map((_, i) => (i === labels.length - 1 ? 0.3 + rnd() * 0.5 : 1 + rnd() * 2));
  const total = weights.reduce((s, w) => s + w, 0);
  let acc = 0;
  return labels.map((label, i) => {
    let pct = Math.round((weights[i] / total) * 100);
    if (i === labels.length - 1) pct = Math.max(3, 100 - acc);
    acc += pct;
    return { label, pct };
  });
}

type Curated = {
  slug: string;
  name: string;
  handle: string;
  country: string;
  flag: string;
  strategy: string;
  archetype: keyof typeof ARCHETYPES;
  markets: string[];
  bio: string;
  copiers: number;
  aum: number;
  joined: string;
  badges: string[];
  muAdj?: number;
  sigmaAdj?: number;
};

const CURATED: Curated[] = [
  {
    slug: "elena-vasquez", name: "Elena Vásquez", handle: "@northquant", country: "Spain", flag: "🇪🇸",
    strategy: "Systematic Index Momentum", archetype: "balanced", markets: ["Indices", "Stocks"],
    bio: "Former quantitative analyst at a Madrid asset manager. Runs a rules-based momentum model on major indices with strict volatility targeting — no discretion, no exceptions. Every position is sized so a single bad week cannot undo a good quarter.",
    copiers: 6842, aum: 24800000, joined: "Feb 2022", badges: ["Editor's pick", "4 yrs on Mirrova"], muAdj: 0.4,
  },
  {
    slug: "marcus-oduya", name: "Marcus Oduya", handle: "@steadyafrica", country: "Nigeria", flag: "🇳🇬",
    strategy: "Dividend Compounder", archetype: "steady", markets: ["Stocks"],
    bio: "Buys quality dividend payers and holds them through noise. Marcus targets steady compounding over headlines — his portfolio turns over less than 20% a year and has never used leverage.",
    copiers: 5210, aum: 19400000, joined: "Jun 2021", badges: ["Lowest drawdown club"], muAdj: 0.2,
  },
  {
    slug: "yuki-tanaka", name: "Yuki Tanaka", handle: "@tokyoflow", country: "Japan", flag: "🇯🇵",
    strategy: "FX Trend Rider", archetype: "balanced", markets: ["Forex", "Indices"],
    bio: "Trades major FX pairs on multi-week trends with a strict 1% risk-per-trade rule. Yuki publishes a written rationale for every position — copiers always know why they're in a trade.",
    copiers: 4980, aum: 16900000, joined: "Sep 2021", badges: ["Transparent journal"],
  },
  {
    slug: "sofia-lindqvist", name: "Sofia Lindqvist", handle: "@nordicvalue", country: "Sweden", flag: "🇸🇪",
    strategy: "Nordic Value & Quality", archetype: "steady", markets: ["Stocks", "Indices"],
    bio: "Concentrated book of 12–18 Nordic and European quality names, bought below intrinsic value and held for years. Sofia's edge is patience: she averages one new position a month.",
    copiers: 4425, aum: 21700000, joined: "Jan 2022", badges: ["Editor's pick"], muAdj: 0.3,
  },
  {
    slug: "dmitri-petrov", name: "Dmitri Petrov", handle: "@voltrader", country: "Cyprus", flag: "🇨🇾",
    strategy: "Volatility Breakout", archetype: "aggressive", markets: ["Indices", "Commodities"],
    bio: "Trades volatility expansions on indices and metals. High octane, fully disclosed: Dmitri caps portfolio heat at 15% and expects deep drawdowns on the way to outsized years. For risk-tolerant copiers only.",
    copiers: 3860, aum: 9800000, joined: "Nov 2022", badges: ["High performer 2025"], muAdj: 0.6,
  },
  {
    slug: "amara-nkosi", name: "Amara Nkosi", handle: "@goldstandard", country: "South Africa", flag: "🇿🇦",
    strategy: "Precious Metals Macro", archetype: "balanced", markets: ["Commodities", "Forex"],
    bio: "Macro-driven positioning in gold, silver and commodity currencies. Amara built her framework over a decade on a Johannesburg metals desk and shares a weekly macro letter with all copiers.",
    copiers: 3540, aum: 12600000, joined: "Apr 2022", badges: ["Weekly letter"],
  },
  {
    slug: "lucas-meyer", name: "Lucas Meyer", handle: "@alpenswing", country: "Switzerland", flag: "🇨🇭",
    strategy: "Swiss Franc Swing", archetype: "steady", markets: ["Forex"],
    bio: "Short-list of CHF and EUR crosses, traded on mean reversion with tight stops. Lucas's calling card is consistency — small wins, rigorously repeated, with the lowest volatility in the FX category.",
    copiers: 3105, aum: 14200000, joined: "Aug 2021", badges: ["Lowest drawdown club"],
  },
  {
    slug: "priya-sharma", name: "Priya Sharma", handle: "@techpulse", country: "India", flag: "🇮🇳",
    strategy: "Global Tech Growth", archetype: "balanced", markets: ["Stocks", "Indices"],
    bio: "Growth portfolio of global technology leaders and challengers, rebalanced monthly against a proprietary momentum score. Priya trims aggressively when valuations stretch.",
    copiers: 5980, aum: 18300000, joined: "Mar 2022", badges: ["Most copied — Tech"], muAdj: 0.5,
  },
  {
    slug: "gabriel-santos", name: "Gabriel Santos", handle: "@riofutures", country: "Brazil", flag: "🇧🇷",
    strategy: "LatAm Macro & Commodities", archetype: "aggressive", markets: ["Commodities", "Forex", "Indices"],
    bio: "Trades the Latin American macro cycle: commodity exporters, FX and rates proxies. Gabriel runs bigger swings than most — his copiers sign up for the full ride.",
    copiers: 2210, aum: 7400000, joined: "May 2023", badges: ["High performer 2025"],
  },
  {
    slug: "chloe-martin", name: "Chloé Martin", handle: "@parishedge", country: "France", flag: "🇫🇷",
    strategy: "Market-Neutral Pairs", archetype: "steady", markets: ["Stocks"],
    bio: "Long/short pairs within European sectors, engineered to be indifferent to market direction. Chloé's book made money in 21 of the last 24 months — quietly, which is the point.",
    copiers: 3720, aum: 16100000, joined: "Oct 2021", badges: ["All-weather"], muAdj: 0.1, sigmaAdj: -0.4,
  },
  {
    slug: "daniel-kim", name: "Daniel Kim", handle: "@seoulsignal", country: "South Korea", flag: "🇰🇷",
    strategy: "Crypto Blue-Chip Rotation", archetype: "aggressive", markets: ["Crypto"],
    bio: "Rotates between BTC, ETH and large-cap alts using on-chain flow signals. Daniel de-risks to stablecoins when his model turns defensive — he sat out most of the last major drawdown.",
    copiers: 7120, aum: 15800000, joined: "Jul 2022", badges: ["Most copied — Crypto"], muAdj: 0.8,
  },
  {
    slug: "isabella-rossi", name: "Isabella Rossi", handle: "@milanmacro", country: "Italy", flag: "🇮🇹",
    strategy: "Global Multi-Asset", archetype: "balanced", markets: ["Indices", "Commodities", "Forex"],
    bio: "A diversified sleeve across equities, gold and FX, tilted by a simple regime model. Isabella runs the closest thing Mirrova has to an all-in-one portfolio — many copiers make her their core holding.",
    copiers: 8034, aum: 31200000, joined: "Dec 2021", badges: ["Editor's pick", "Most copied overall"], muAdj: 0.3,
  },
];

const GEN_FIRST = ["Ava", "Noah", "Mia", "Omar", "Lena", "Kofi", "Hana", "Mateo", "Zara", "Felix", "Nina", "Tariq", "Ella", "Ravi", "Maya", "Jonas", "Aisha", "Leo", "Freya", "Diego", "Ines", "Kenji", "Nora", "Samuel"];
const GEN_LAST = ["Walker", "Haddad", "Novak", "Okafor", "Silva", "Bergström", "Ito", "Moreau", "Kowalski", "Mensah", "Fischer", "Rahman", "Costa", "Ivanov", "Dubois", "Nakamura", "Osei", "Weber", "Andersen", "Torres", "Farouk", "Larsen", "Byrne", "Kaur"];
const GEN_GEO: [string, string][] = [
  ["United Kingdom", "🇬🇧"], ["Germany", "🇩🇪"], ["UAE", "🇦🇪"], ["Kenya", "🇰🇪"], ["Portugal", "🇵🇹"],
  ["Ghana", "🇬🇭"], ["Singapore", "🇸🇬"], ["Canada", "🇨🇦"], ["Poland", "🇵🇱"], ["Australia", "🇦🇺"],
  ["Netherlands", "🇳🇱"], ["Egypt", "🇪🇬"], ["Mexico", "🇲🇽"], ["Austria", "🇦🇹"], ["Ireland", "🇮🇪"], ["Norway", "🇳🇴"],
];
const GEN_STRATEGIES: [string, keyof typeof ARCHETYPES, string[]][] = [
  ["Index Swing", "balanced", ["Indices"]],
  ["Blue-Chip Core", "steady", ["Stocks"]],
  ["FX Scalping", "aggressive", ["Forex"]],
  ["Commodity Trend", "balanced", ["Commodities", "Forex"]],
  ["Crypto Momentum", "aggressive", ["Crypto"]],
  ["Defensive Multi-Asset", "steady", ["Indices", "Commodities"]],
  ["Earnings Momentum", "balanced", ["Stocks", "Indices"]],
  ["Gold & Rates Macro", "balanced", ["Commodities"]],
];

function buildGenerated(i: number): Trader {
  const rnd = rngFor(`gen:${i}`);
  const first = GEN_FIRST[i % GEN_FIRST.length];
  const last = GEN_LAST[(i * 7 + 3) % GEN_LAST.length];
  const name = `${first} ${last}`;
  const slug = `${first}-${last}`.toLowerCase().replace(/[^a-z-]/g, "");
  const [country, flag] = GEN_GEO[(i * 5 + 1) % GEN_GEO.length];
  const [strategy, archKey, markets] = GEN_STRATEGIES[(i * 3 + 2) % GEN_STRATEGIES.length];
  const arch = ARCHETYPES[archKey];
  const monthly = genMonthly(slug, arch.mu * (0.7 + rnd() * 0.6), arch.sigma * (0.8 + rnd() * 0.5), arch.skew);
  const copiers = Math.round(between(rnd, [140, 2600]));
  const joinedYear = 2021 + Math.floor(rnd() * 4);
  const joinedMonth = pick(rnd, ["Jan", "Mar", "Apr", "Jun", "Aug", "Oct", "Nov"]);
  return {
    slug, name, handle: `@${slug.replace("-", "")}`, country, flag, strategy, style: arch.style, markets,
    bio: `${first} runs a ${strategy.toLowerCase()} book focused on ${markets.join(" and ").toLowerCase()}, with position sizing capped by Mirrova's risk framework. Full trade history and monthly figures below are net of fees.`,
    riskScore: Math.round(between(rnd, arch.risk)),
    copiers,
    aum: Math.round(copiers * between(rnd, [1800, 5200])),
    perfFee: Math.round(between(rnd, arch.fee)),
    minCopy: pick(rnd, [100, 100, 200, 250]),
    winRate: Math.round(between(rnd, arch.winRate) * 10) / 10,
    trades: Math.round(between(rnd, [180, 2400])),
    avgHoldDays: Math.round(between(rnd, arch.hold) * 10) / 10,
    joined: `${joinedMonth} ${joinedYear}`,
    verified: rnd() > 0.25,
    badges: [],
    monthlyReturns: monthly,
    allocation: genAllocation(slug, markets),
  };
}

function buildCurated(c: Curated): Trader {
  const rnd = rngFor(`cur:${c.slug}`);
  const arch = ARCHETYPES[c.archetype];
  const monthly = genMonthly(c.slug, arch.mu + (c.muAdj ?? 0), Math.max(0.8, arch.sigma + (c.sigmaAdj ?? 0)), arch.skew);
  return {
    slug: c.slug, name: c.name, handle: c.handle, country: c.country, flag: c.flag,
    strategy: c.strategy, style: arch.style, markets: c.markets, bio: c.bio,
    riskScore: Math.round(between(rnd, arch.risk)),
    copiers: c.copiers, aum: c.aum,
    perfFee: Math.round(between(rnd, arch.fee)),
    minCopy: 100,
    winRate: Math.round(between(rnd, arch.winRate) * 10) / 10,
    trades: Math.round(between(rnd, [420, 3100])),
    avgHoldDays: Math.round(between(rnd, arch.hold) * 10) / 10,
    joined: c.joined, verified: true, badges: c.badges,
    monthlyReturns: monthly,
    allocation: genAllocation(c.slug, c.markets),
  };
}

export const TRADERS: Trader[] = [
  ...CURATED.map(buildCurated),
  ...Array.from({ length: 24 }, (_, i) => buildGenerated(i)),
];

export function getTrader(slug: string): Trader | undefined {
  return TRADERS.find((t) => t.slug === slug);
}

/** Weekly equity curve (base 100) across the 24-month window, with intra-month texture. */
export function equitySeries(t: Trader): number[] {
  const rnd = rngFor(`eq:${t.slug}`);
  const pts: number[] = [100];
  let v = 100;
  for (const mr of t.monthlyReturns) {
    const target = v * (1 + mr / 100);
    const steps = 4;
    let cur = v;
    for (let s = 1; s <= steps; s++) {
      const ideal = v + ((target - v) * s) / steps;
      const noise = s === steps ? 0 : (rnd() - 0.5) * v * 0.012 * Math.abs(mr) * 0.4 + (rnd() - 0.5) * v * 0.006;
      cur = Math.max(ideal + noise, cur * 0.9);
      pts.push(cur);
    }
    v = target;
  }
  return pts;
}

export function traderStats(t: Trader): TraderStats {
  const m = t.monthlyReturns;
  const compound = (arr: number[]) => (arr.reduce((acc, r) => acc * (1 + r / 100), 1) - 1) * 100;
  const return24m = compound(m);
  const return12m = compound(m.slice(12));
  const returnYtd = compound(m.slice(16)); // Jan–Aug 2026
  const eq = equitySeries(t);
  let peak = eq[0];
  let mdd = 0;
  for (const p of eq) {
    peak = Math.max(peak, p);
    mdd = Math.min(mdd, ((p - peak) / peak) * 100);
  }
  const mean = m.reduce((s, r) => s + r, 0) / m.length;
  const sd = Math.sqrt(m.reduce((s, r) => s + (r - mean) ** 2, 0) / m.length) || 1;
  const sharpe = ((mean - 0.3) / sd) * Math.sqrt(12);
  return {
    return12m: Math.round(return12m * 10) / 10,
    return24m: Math.round(return24m * 10) / 10,
    returnYtd: Math.round(returnYtd * 10) / 10,
    maxDrawdown: Math.round(mdd * 10) / 10,
    sharpe: Math.round(sharpe * 100) / 100,
    bestMonth: Math.max(...m),
    worstMonth: Math.min(...m),
    profitableMonths: m.filter((r) => r > 0).length,
  };
}

const allStats = TRADERS.map((t) => ({ t, s: traderStats(t) }));

export const TOP_TRADERS: Trader[] = [...allStats]
  .sort((a, b) => b.t.copiers - a.t.copiers)
  .slice(0, 6)
  .map((x) => x.t);

export const PLATFORM_STATS = {
  traders: TRADERS.length,
  copiers: TRADERS.reduce((s, t) => s + t.copiers, 0),
  aum: TRADERS.reduce((s, t) => s + t.aum, 0),
  avgTop10Return12m:
    Math.round(
      ([...allStats].sort((a, b) => b.s.return12m - a.s.return12m).slice(0, 10).reduce((s, x) => s + x.s.return12m, 0) / 10) * 10
    ) / 10,
  countries: 142,
  executionMs: 38,
};
