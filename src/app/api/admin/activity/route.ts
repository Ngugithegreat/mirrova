import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/server/adminAuth";
import { getActivityList } from "@/server/admin";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json(await getActivityList(getDb()));
}
