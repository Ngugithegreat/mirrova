import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/adminAuth";

export async function GET() {
  return NextResponse.json({ ok: await requireAdmin() });
}
