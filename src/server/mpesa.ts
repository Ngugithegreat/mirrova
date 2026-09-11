
function baseUrl() {
  return process.env.MPESA_ENVIRONMENT === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;

  const key = required("MPESA_CONSUMER_KEY");
  const secret = required("MPESA_CONSUMER_SECRET");
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await fetch(`${baseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error(`M-Pesa OAuth failed: ${res.status}`);
  const data = await res.json();

  cachedToken = { token: data.access_token, expiresAt: Date.now() + 55 * 60_000 };
  return cachedToken.token;
}

/**
 * Verifies the Consumer Key/Secret are valid by fetching an OAuth token —
 * nothing is charged and no phone is contacted. Safe to call anytime.
 */
export async function checkMpesaCredentials(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    cachedToken = null; // force a fresh check, don't trust a stale cached token
    await getAccessToken();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/** Accepts 07XXXXXXXX, 7XXXXXXXX, +2547XXXXXXXX, or 2547XXXXXXXX; returns 2547XXXXXXXX or null. */
export function normalizeKenyanPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (/^2547\d{8}$/.test(digits) || /^2541\d{8}$/.test(digits)) return digits;
  if (/^0[71]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^[71]\d{8}$/.test(digits)) return `254${digits}`;
  return null;
}

export type StkPushResult =
  | { ok: true; checkoutRequestId: string; merchantRequestId: string }
  | { ok: false; error: string };

export async function stkPush(phone: string, amountKes: number, accountRef: string): Promise<StkPushResult> {
  try {
    const shortCode = required("MPESA_SHORTCODE");
    const passkey = required("MPESA_PASSKEY");
    // A Till (Buy Goods) that is a *child* of this shortcode uses a distinct
    // PartyB — falls back to the shortcode itself for a plain paybill setup.
    const partyB = process.env.MPESA_TILL_NUMBER || shortCode;
    const transactionType = process.env.MPESA_TRANSACTION_TYPE || "CustomerPayBillOnline";
    const ts = timestamp();
    const password = Buffer.from(`${shortCode}${passkey}${ts}`).toString("base64");
    const callbackUrl = required("MPESA_CALLBACK_URL");
    const token = await getAccessToken();

    const res = await fetch(`${baseUrl()}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: ts,
        TransactionType: transactionType,
        Amount: Math.max(1, Math.round(amountKes)),
        PartyA: phone,
        PartyB: partyB,
        PhoneNumber: phone,
        CallBackURL: callbackUrl,
        AccountReference: accountRef.slice(0, 12),
        TransactionDesc: "Mirrova wallet deposit",
      }),
    });
    const data = await res.json();
    console.log("[stkPush]", JSON.stringify(data));

    if (data.ResponseCode === "0" && data.CheckoutRequestID) {
      return { ok: true, checkoutRequestId: data.CheckoutRequestID, merchantRequestId: data.MerchantRequestID };
    }
    return { ok: false, error: data.errorMessage || data.ResponseDescription || "STK push failed." };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "STK push failed." };
  }
}

export type StkQueryResult =
  | { status: "completed"; mpesaReceipt?: string }
  | { status: "failed"; reason: string }
  | { status: "pending" };

/**
 * The STK callback is unreliable in practice, so this is the authoritative
 * reconciliation path. Safaricom returns "still under processing" (as
 * errorMessage on a non-200, OR as ResultDesc on a 200) while the customer
 * hasn't entered their PIN yet — that must read as pending, never failed.
 */
export async function stkQuery(checkoutRequestId: string): Promise<StkQueryResult> {
  const shortCode = required("MPESA_SHORTCODE");
  const passkey = required("MPESA_PASSKEY");
  const ts = timestamp();
  const password = Buffer.from(`${shortCode}${passkey}${ts}`).toString("base64");
  const token = await getAccessToken();

  const res = await fetch(`${baseUrl()}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: ts,
      CheckoutRequestID: checkoutRequestId,
    }),
  });
  const data = await res.json().catch(() => ({}));
  console.log("[stkQuery]", JSON.stringify(data));

  const desc: string = data.errorMessage || data.ResultDesc || "";
  if (/still under processing|being processed/i.test(desc)) return { status: "pending" };
  if (!res.ok || data.errorCode) return { status: "pending" };

  if (data.ResultCode === "0" || data.ResultCode === 0) {
    return { status: "completed", mpesaReceipt: data.MpesaReceiptNumber };
  }
  if (data.ResultCode === undefined || data.ResultCode === null) return { status: "pending" };
  return { status: "failed", reason: desc || `Code ${data.ResultCode}` };
}

/** Parses the raw STK callback POST body from Safaricom. */
export function parseStkCallback(body: unknown): {
  checkoutRequestId: string;
  merchantRequestId: string;
  resultCode: number;
  resultDesc: string;
  amount?: number;
  mpesaReceipt?: string;
  phone?: string;
} | null {
  const cb = (body as { Body?: { stkCallback?: Record<string, unknown> } })?.Body?.stkCallback;
  if (!cb || typeof cb.CheckoutRequestID !== "string") return null;

  const items = (cb.CallbackMetadata as { Item?: { Name: string; Value?: unknown }[] } | undefined)?.Item ?? [];
  const get = (name: string) => items.find((i) => i.Name === name)?.Value;

  return {
    checkoutRequestId: cb.CheckoutRequestID as string,
    merchantRequestId: cb.MerchantRequestID as string,
    resultCode: Number(cb.ResultCode),
    resultDesc: String(cb.ResultDesc ?? ""),
    amount: typeof get("Amount") === "number" ? (get("Amount") as number) : undefined,
    mpesaReceipt: typeof get("MpesaReceiptNumber") === "string" ? (get("MpesaReceiptNumber") as string) : undefined,
    phone: get("PhoneNumber") != null ? String(get("PhoneNumber")) : undefined,
  };
}
