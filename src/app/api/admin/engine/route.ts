import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/server/adminAuth";
import { getEngineAdminView } from "@/server/copyEngine";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json(await getEngineAdminView(getDb()));
}
