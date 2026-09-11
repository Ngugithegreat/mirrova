import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { submitKyc } from "@/server/kyc";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const result = await submitKyc(getDb(), user.id, {
    fullName: typeof body?.fullName === "string" ? body.fullName : "",
    idType: typeof body?.idType === "string" ? body.idType : "",
    idNumber: typeof body?.idNumber === "string" ? body.idNumber : "",
    dateOfBirth: typeof body?.dateOfBirth === "string" ? body.dateOfBirth : "",
    address: typeof body?.address === "string" ? body.address : "",
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
