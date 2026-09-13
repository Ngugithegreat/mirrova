import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { requireAdmin } from "@/server/adminAuth";
import { blowIllustrativeEquity } from "@/server/copyEngine";

/** Testing-only: crashes a user's illustrative equity to $0 (see
 * blowIllustrativeEquity's doc) — never touches real balances. */
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email) return NextResponse.json({ error: "Enter the target user's email." }, { status: 400 });

  const db = getDb();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (!user) return NextResponse.json({ error: "No user with that email." }, { status: 404 });

  const result = await blowIllustrativeEquity(db, user.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
