import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/server/adminAuth";
import { grantBonus } from "@/server/realAccount";
import { blowAllIllustrativeEquity } from "@/server/copyEngine";
import { setBlowSchedule, clearBlowSchedule, getBlowSchedule } from "@/server/settings";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/** Testing-only admin actions — no real payment/settlement involved. */
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const action = body?.action;
  const db = getDb();

  if (action === "credit") {
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const amount = Number(body?.amount);
    if (!email || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Enter an email and a positive amount." }, { status: 400 });
    }
    const [user] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.email, email)).limit(1);
    if (!user) return NextResponse.json({ error: `No user with email ${email}.` }, { status: 404 });
    const result = await grantBonus(db, user.id, Math.round(amount * 100), "TEST funds (no real payment)");
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, message: `Credited ${user.name} with $${amount}.` });
  }

  if (action === "blow") {
    const email = typeof body?.email === "string" && body.email.trim() ? body.email.trim() : undefined;
    const res = await blowAllIllustrativeEquity(db, email);
    return NextResponse.json({ ok: true, message: `Blew ${res.blown} account${res.blown === 1 ? "" : "s"}.` });
  }

  if (action === "schedule-blow") {
    const minutes = Number(body?.minutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return NextResponse.json({ error: "Enter minutes from now (e.g. 2)." }, { status: 400 });
    }
    const email = typeof body?.email === "string" && body.email.trim() ? body.email.trim() : null;
    const at = Date.now() + minutes * 60_000;
    await setBlowSchedule(db, at, email);
    const who = email ?? "all accounts";
    return NextResponse.json({ ok: true, message: `Scheduled: ${who} will blow in ${minutes} min.`, at });
  }

  if (action === "cancel-blow") {
    await clearBlowSchedule(db);
    return NextResponse.json({ ok: true, message: "Scheduled blow cancelled." });
  }

  if (action === "blow-status") {
    return NextResponse.json({ ok: true, schedule: await getBlowSchedule(db) });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
