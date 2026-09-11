import { NextResponse } from "next/server";
import { verifyAdminPassword, createAdminCookieValue, ADMIN_COOKIE } from "@/server/adminAuth";

export async function POST(req: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Admin login is not configured." }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  const result = verifyAdminPassword(password);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createAdminCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  return res;
}
