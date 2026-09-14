import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/server/adminAuth";
import { getDepositsList, reconcileDeposit, reconcileCryptoDeposit, forceCreditDeposit, forceCreditCryptoDeposit } from "@/server/admin";

export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const status = new URL(req.url).searchParams.get("status") ?? undefined;
  return NextResponse.json(await getDepositsList(getDb(), status));
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const method = body?.method === "crypto" ? "crypto" : "mpesa";
  const action = body?.action === "credit" ? "credit" : "reconcile";
  const detail = typeof body?.detail === "string" ? body.detail : "";
  if (!detail) return NextResponse.json({ error: "Missing detail." }, { status: 400 });

  const db = getDb();
  const result =
    action === "credit"
      ? method === "crypto"
        ? await forceCreditCryptoDeposit(db, detail)
        : await forceCreditDeposit(db, detail)
      : method === "crypto"
        ? await reconcileCryptoDeposit(db, detail)
        : await reconcileDeposit(db, detail);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, status: "status" in result ? result.status : "completed", creditedUsdCents: result.creditedUsdCents });
}
