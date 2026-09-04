import { cookies } from "next/headers";
import { getDb } from "@/db/client";
import { getUserByToken } from "./account";

export const SESSION_COOKIE = "mirrova_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function getSessionUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getUserByToken(getDb(), token);
}
