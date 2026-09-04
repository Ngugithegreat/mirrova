import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { signUp } from "@/server/account";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/server/session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (name.length < 2) return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const result = await signUp(getDb(), name, email, password);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
