import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/session";
import { listAvailableCurrencies } from "@/server/nowpayments";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  return NextResponse.json({ currencies: await listAvailableCurrencies() });
}
