import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "asporttraders_admin_session";
const ADMIN_SESSION_MS = 12 * 60 * 60 * 1000; // 12 hours — shorter than the 30-day user session

/** Constant-time compare against ADMIN_PASSWORD. No default: an unset env
 * var always fails, it never falls back to an open door. */
export function verifyAdminPassword(password: string): { ok: true } | { ok: false; error: string } {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return { ok: false, error: "Admin login is not configured." };

  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, error: "Incorrect password." };
  }
  return { ok: true };
}

/** Exported for tests — lets verify-backend.ts construct a correctly-signed
 * but deliberately expired cookie, which createAdminCookieValue() can't. */
export function sign(payload: string): string {
  return createHmac("sha256", process.env.ADMIN_PASSWORD ?? "").update(payload).digest("hex");
}

/** A signed, expiring cookie value — no DB row, since there's one shared
 * admin credential rather than per-admin accounts. */
export function createAdminCookieValue(): string {
  const expiresAt = String(Date.now() + ADMIN_SESSION_MS);
  return `${expiresAt}.${sign(expiresAt)}`;
}

export function verifyAdminCookieValue(value: string | undefined): boolean {
  if (!value) return false;
  const [expiresAt, sig] = value.split(".");
  if (!expiresAt || !sig) return false;
  if (Date.now() > Number(expiresAt)) return false;

  const expectedSig = sign(expiresAt);
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function requireAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifyAdminCookieValue(store.get(ADMIN_COOKIE)?.value);
}
