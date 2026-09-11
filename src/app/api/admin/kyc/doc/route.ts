import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/server/adminAuth";
import { getKycDocumentBlob } from "@/server/kyc";

/** Streams a private KYC document back to an authenticated admin only —
 * never a public URL. `getKycDocumentBlob` restricts this to a `kyc/`
 * pathname that's actually attached to a real document row. */
export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const pathname = new URL(req.url).searchParams.get("path") ?? "";
  const blob = await getKycDocumentBlob(getDb(), pathname);
  if (!blob || blob.statusCode !== 200) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return new NextResponse(blob.stream, {
    headers: { "Content-Type": blob.blob.contentType, "Cache-Control": "private, no-store" },
  });
}
