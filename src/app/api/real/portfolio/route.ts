import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { listClosedCopyPositions } from "@/server/copyEngine";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const closedPositions = await listClosedCopyPositions(getDb(), user.id, 50);
  return NextResponse.json({ closedPositions });
}
