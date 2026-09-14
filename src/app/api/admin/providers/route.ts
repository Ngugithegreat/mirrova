import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/server/adminAuth";
import { listAdminProviders, createProvider } from "@/server/providers";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ providers: await listAdminProviders(getDb()) });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await req.json().catch(() => null);

  const result = await createProvider(getDb(), {
    name: typeof body?.name === "string" ? body.name : "",
    country: typeof body?.country === "string" ? body.country : "",
    flag: typeof body?.flag === "string" ? body.flag : undefined,
    strategy: typeof body?.strategy === "string" ? body.strategy : "",
    style: typeof body?.style === "string" ? body.style : "",
    markets: Array.isArray(body?.markets) ? body.markets.filter((m: unknown): m is string => typeof m === "string") : [],
    bio: typeof body?.bio === "string" ? body.bio : "",
    perfFee: Number(body?.perfFee),
    minCopy: Number(body?.minCopy),
    winRate: Number(body?.winRate),
    verified: body?.verified !== false,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, slug: result.slug });
}
