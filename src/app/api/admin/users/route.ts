import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/server/adminAuth";
import { getUsersList } from "@/server/admin";

export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q") ?? undefined;
  return NextResponse.json({ users: await getUsersList(getDb(), q) });
}
