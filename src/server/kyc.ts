import { createHash, randomUUID } from "crypto";
import { eq, desc, and } from "drizzle-orm";
import { put, get as getBlob } from "@vercel/blob";
import { users, kycProfiles, kycDocuments, activity } from "@/db/schema";
import type { AppDb } from "@/db/types";

type Result<T> = { ok: false; error: string } | ({ ok: true } & T);
function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

const ID_TYPES = ["passport", "national_id", "drivers_license"] as const;
const DOC_KINDS = ["id_front", "id_back", "selfie"] as const;
export type KycIdType = (typeof ID_TYPES)[number];
export type KycDocKind = (typeof DOC_KINDS)[number];

/** Not stored raw anywhere: only this masked value and the hash below ever
 * touch the database. A missing KYC_HASH_SECRET only weakens the hash's
 * resistance to a rainbow-table guess — unlike ADMIN_PASSWORD, it never
 * exposes a raw number or lets someone forge a review, so this fails open
 * to a fixed pepper rather than fails closed. */
function hashIdNumber(idNumber: string): string {
  const pepper = process.env.KYC_HASH_SECRET || "asporttraders-kyc-pepper-fallback";
  return createHash("sha256").update(`${pepper}:${idNumber.trim().toUpperCase()}`).digest("hex");
}

function maskIdNumber(idNumber: string): string {
  const trimmed = idNumber.trim();
  return `•••• ${trimmed.slice(-4)}`;
}

export type SubmitKycInput = {
  fullName: string;
  idType: string;
  idNumber: string;
  dateOfBirth: string;
  address: string;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export async function submitKyc(db: AppDb, userId: string, input: SubmitKycInput): Promise<Result<{}>> {
  const fullName = input.fullName.trim();
  const idNumber = input.idNumber.trim();
  const address = input.address.trim();

  if (!fullName) return fail("Enter your full legal name.");
  if (!ID_TYPES.includes(input.idType as KycIdType)) return fail("Choose a valid ID type.");
  if (idNumber.length < 4) return fail("Enter a valid ID number.");
  if (!input.dateOfBirth) return fail("Enter your date of birth.");
  if (!address) return fail("Enter your address.");

  const [existing] = await db.select().from(kycProfiles).where(eq(kycProfiles.userId, userId)).limit(1);
  if (existing?.status === "verified") return fail("Your identity is already verified.");
  if (existing?.status === "pending") return fail("Your submission is already under review.");

  const values = {
    userId,
    status: "pending",
    fullName,
    idType: input.idType,
    idNumberMasked: maskIdNumber(idNumber),
    idNumberHash: hashIdNumber(idNumber),
    dateOfBirth: input.dateOfBirth,
    address,
    submittedAt: new Date(),
    reviewedAt: null,
    reviewNote: null,
  };

  if (existing) {
    await db.update(kycProfiles).set(values).where(eq(kycProfiles.id, existing.id));
  } else {
    await db.insert(kycProfiles).values(values);
  }
  await db.insert(activity).values({ userId, text: "Submitted identity verification for review" });
  return { ok: true };
}

export async function getKycStatus(db: AppDb, userId: string) {
  const [profile] = await db.select().from(kycProfiles).where(eq(kycProfiles.userId, userId)).limit(1);
  const documents = await db
    .select({ kind: kycDocuments.kind, uploadedAt: kycDocuments.uploadedAt })
    .from(kycDocuments)
    .where(eq(kycDocuments.userId, userId));

  return {
    status: profile?.status ?? "unsubmitted",
    fullName: profile?.fullName ?? null,
    idType: profile?.idType ?? null,
    idNumberMasked: profile?.idNumberMasked ?? null,
    dateOfBirth: profile?.dateOfBirth ?? null,
    address: profile?.address ?? null,
    reviewNote: profile?.reviewNote ?? null,
    submittedAt: profile?.submittedAt ?? null,
    documents,
  };
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export async function uploadKycDocument(db: AppDb, userId: string, kind: string, body: Buffer, contentType: string): Promise<Result<{}>> {
  if (!DOC_KINDS.includes(kind as KycDocKind)) return fail("Unknown document type.");
  if (body.byteLength === 0) return fail("Empty file.");
  if (body.byteLength > 10 * 1024 * 1024) return fail("File is too large (max 10MB).");

  const [profile] = await db.select({ status: kycProfiles.status }).from(kycProfiles).where(eq(kycProfiles.userId, userId)).limit(1);
  if (profile?.status === "verified") return fail("Your identity is already verified.");

  const pathname = `kyc/${userId}/${kind}-${randomUUID()}`;
  try {
    await put(pathname, body, { access: "private", contentType });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not upload the document — try again shortly.");
  }

  await db.insert(kycDocuments).values({ userId, kind, blobPathname: pathname, contentType });
  return { ok: true };
}

export async function listKycQueue(db: AppDb, status?: string) {
  const rows = await db
    .select()
    .from(kycProfiles)
    .where(status ? eq(kycProfiles.status, status) : undefined)
    .orderBy(desc(kycProfiles.submittedAt))
    .limit(100);

  const out = [];
  for (const p of rows) {
    const [user] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, p.userId)).limit(1);
    const documents = await db
      .select({ id: kycDocuments.id, kind: kycDocuments.kind, blobPathname: kycDocuments.blobPathname })
      .from(kycDocuments)
      .where(eq(kycDocuments.userId, p.userId));
    out.push({ ...p, user: user ?? null, documents });
  }
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export async function reviewKyc(db: AppDb, userId: string, decision: "verified" | "rejected", note?: string): Promise<Result<{}>> {
  const [profile] = await db.select().from(kycProfiles).where(eq(kycProfiles.userId, userId)).limit(1);
  if (!profile) return fail("No submission found for this user.");
  if (profile.status !== "pending") return fail("This submission was already reviewed.");

  await db
    .update(kycProfiles)
    .set({ status: decision, reviewedAt: new Date(), reviewNote: note ?? null })
    .where(eq(kycProfiles.id, profile.id));

  await db.insert(activity).values({
    userId,
    text: decision === "verified" ? "Your identity was verified" : `Your identity verification was rejected${note ? `: ${note}` : ""}`,
  });
  return { ok: true };
}

/** Streams a private KYC document back for the admin proxy route. Restricted
 * to the `kyc/` prefix and to a pathname that's actually attached to a real
 * document row — a private blob's URL is unguessable, but this closes off
 * any path-traversal-style attempt to fetch an arbitrary pathname. */
export async function getKycDocumentBlob(db: AppDb, pathname: string) {
  if (!pathname.startsWith("kyc/")) return null;
  const [doc] = await db.select().from(kycDocuments).where(and(eq(kycDocuments.blobPathname, pathname))).limit(1);
  if (!doc) return null;
  try {
    return await getBlob(pathname, { access: "private" });
  } catch {
    return null;
  }
}
