import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { switchAccountType } from "@/server/realAccount";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const accountType = typeof body?.accountType === "string" ? body.accountType : "";

  const result = await switchAccountType(getDb(), user.id, accountType);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
