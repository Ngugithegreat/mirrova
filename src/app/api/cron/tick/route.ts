import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { tickEngine, checkScheduledBlows } from "@/server/copyEngine";

/**
 * The illustrative engine's heartbeat. This stack has no built-in cron —
 * every other read of the engine (admin view, a user's own wallet) already
 * ticks it lazily, but that means it only advances when someone happens to
 * load a page. This endpoint lets an external scheduler (see
 * .github/workflows/engine-tick.yml) poke it every few minutes so it
 * keeps generating real-price-based illustrative trades on its own clock,
 * for observing multi-day behavior without anyone needing to keep a tab
 * open. Same hard rule as everywhere else: this can never touch a real
 * balance, only the illustrative display.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_TICK_SECRET;
  if (!secret) return false; // fail closed — never allow an unauthenticated trigger
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const key = new URL(req.url).searchParams.get("key");
  return key === secret;
}

async function handle(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const db = getDb();
    await checkScheduledBlows(db);
    await tickEngine(db);
    return NextResponse.json({ ok: true, tickedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[cron/tick] failed:", err);
    return NextResponse.json({ ok: false, error: "Tick failed." }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
