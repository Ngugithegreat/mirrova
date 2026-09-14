import { eq, desc } from "drizzle-orm";
import { adminProviders } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { getTrader, TRADERS, traderFromAdminProvider, type RiskStyle, type Trader } from "@/lib/traders";

type Result<T> = { ok: false; error: string } | ({ ok: true } & T);
function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

const STYLES: RiskStyle[] = ["Conservative", "Balanced", "Aggressive"];

function rowToTrader(row: typeof adminProviders.$inferSelect): Trader {
  return traderFromAdminProvider({
    slug: row.slug,
    name: row.name,
    country: row.country,
    flag: row.flag,
    strategy: row.strategy,
    style: row.style as RiskStyle,
    markets: row.markets.split(",").filter(Boolean),
    bio: row.bio,
    perfFee: row.perfFee,
    minCopy: row.minCopy,
    winRate: row.winRate,
    verified: row.verified,
  });
}

export async function listAdminProviders(db: AppDb) {
  return db.select().from(adminProviders).orderBy(desc(adminProviders.createdAt));
}

/** The full public roster: the static generated traders plus every
 * admin-added provider, as real Trader objects. */
export async function listAllTraders(db: AppDb): Promise<Trader[]> {
  const rows = await listAdminProviders(db);
  return [...TRADERS, ...rows.map(rowToTrader)];
}

/** Looks a trader up by slug across BOTH sources — the static roster first
 * (no DB round-trip for the common case), then admin-added providers. Use
 * this instead of the sync `getTrader` anywhere a slug might belong to an
 * admin-added provider (copy/allocation validation, the copy engine, the
 * public trader profile page). */
export async function getTraderAny(db: AppDb, slug: string): Promise<Trader | undefined> {
  const stat = getTrader(slug);
  if (stat) return stat;
  const [row] = await db.select().from(adminProviders).where(eq(adminProviders.slug, slug)).limit(1);
  return row ? rowToTrader(row) : undefined;
}

export type CreateProviderInput = {
  name: string;
  country: string;
  flag?: string;
  strategy: string;
  style: string;
  markets: string[];
  bio: string;
  perfFee: number;
  minCopy: number;
  winRate: number;
  verified: boolean;
};

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function createProvider(db: AppDb, input: CreateProviderInput): Promise<Result<{ slug: string }>> {
  const name = input.name.trim();
  if (name.length < 2) return fail("Enter a name.");
  if (!STYLES.includes(input.style as RiskStyle)) return fail("Choose a risk style.");
  if (!input.markets || input.markets.length === 0) return fail("Choose at least one market.");
  if (!Number.isFinite(input.perfFee) || input.perfFee < 0 || input.perfFee > 50) return fail("Performance fee must be 0-50%.");
  if (!Number.isFinite(input.minCopy) || input.minCopy < 1) return fail("Enter a valid minimum copy amount.");
  if (!Number.isFinite(input.winRate) || input.winRate < 1 || input.winRate > 99) return fail("Win rate must be 1-99%.");

  const baseSlug = slugify(name);
  if (!baseSlug) return fail("Enter a valid name.");
  let slug = baseSlug;
  let suffix = 2;
  while (getTrader(slug) || (await db.select({ id: adminProviders.id }).from(adminProviders).where(eq(adminProviders.slug, slug)).limit(1)).length > 0) {
    slug = `${baseSlug}-${suffix++}`;
  }

  await db.insert(adminProviders).values({
    slug,
    name,
    country: input.country.trim() || "—",
    flag: input.flag?.trim() || "🏳️",
    strategy: input.strategy.trim() || "General",
    style: input.style,
    markets: input.markets.join(","),
    bio: input.bio.trim() || `${name} is a newly added strategist on Asport Traders.`,
    perfFee: Math.round(input.perfFee),
    minCopy: Math.round(input.minCopy),
    winRate: input.winRate,
    verified: input.verified,
  });

  return { ok: true, slug };
}
