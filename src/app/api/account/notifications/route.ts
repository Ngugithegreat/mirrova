import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { updateNotificationPrefs } from "@/server/account";

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const prefs: { notifyProductUpdates?: boolean; notifySignalAlerts?: boolean } = {};
  if (typeof body?.notifyProductUpdates === "boolean") prefs.notifyProductUpdates = body.notifyProductUpdates;
  if (typeof body?.notifySignalAlerts === "boolean") prefs.notifySignalAlerts = body.notifySignalAlerts;

  const result = await updateNotificationPrefs(getDb(), user.id, prefs);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
