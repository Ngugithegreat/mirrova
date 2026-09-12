import { createHmac, timingSafeEqual } from "crypto";

const API_BASE = "https://api.nowpayments.io/v1";
const MIN_USD = 50;

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

/**
 * Verifies the API key is valid by asking NOWPayments for its own status —
 * nothing is charged, no address is generated. Safe to call anytime.
 */
export async function checkNowPaymentsCredentials(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const apiKey = required("NOWPAYMENTS_API_KEY");
    const res = await fetch(`${API_BASE}/status`, { headers: { "x-api-key": apiKey } });
    if (!res.ok) return { ok: false, error: `NOWPayments status check failed: ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export type CreatePaymentResult =
  | { ok: true; providerPaymentId: string; payAddress: string; payCurrency: string }
  | { ok: false; error: string };

const DEFAULT_PAY_CURRENCY = "usdttrc20";

export async function createPayment(
  amountUsd: number,
  orderId: string,
  callbackUrl: string,
  payCurrency: string = DEFAULT_PAY_CURRENCY
): Promise<CreatePaymentResult> {
  try {
    if (!Number.isFinite(amountUsd) || amountUsd < MIN_USD) {
      return { ok: false, error: `Minimum crypto deposit is $${MIN_USD}.` };
    }
    const apiKey = required("NOWPAYMENTS_API_KEY");

    const res = await fetch(`${API_BASE}/payment`, {
      method: "POST",
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        price_amount: amountUsd,
        price_currency: "usd",
        pay_currency: payCurrency,
        order_id: orderId,
        order_description: "Asport Traders wallet deposit",
        ipn_callback_url: callbackUrl,
      }),
    });
    const data = await res.json().catch(() => ({}));
    console.log("[nowpayments:createPayment]", JSON.stringify(data));

    if (!res.ok || !data.payment_id || !data.pay_address) {
      return { ok: false, error: data.message || "Could not create a crypto deposit address." };
    }
    return {
      ok: true,
      providerPaymentId: String(data.payment_id),
      payAddress: data.pay_address,
      payCurrency: data.pay_currency ?? payCurrency,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not create a crypto deposit address." };
  }
}

/** The currencies actually enabled on this NOWPayments merchant account
 * (configured in their dashboard) — not the full platform list, since
 * offering a currency the merchant hasn't enabled would just fail at
 * payment-creation time. Falls back to the single default on any error so
 * the deposit form always has at least one working option. */
export async function listAvailableCurrencies(): Promise<string[]> {
  try {
    const apiKey = required("NOWPAYMENTS_API_KEY");
    const res = await fetch(`${API_BASE}/merchant/coins`, { headers: { "x-api-key": apiKey } });
    const data = await res.json().catch(() => ({}));
    const coins: unknown = data?.selectedCurrencies;
    if (Array.isArray(coins) && coins.length > 0) return coins.map(String);
  } catch {
    // fall through to default
  }
  return [DEFAULT_PAY_CURRENCY];
}

export type PaymentStatusResult =
  | { status: "completed"; actuallyPaidUsd: number }
  | { status: "failed"; reason: string }
  | { status: "pending" };

/** NOWPayments' own status vocabulary: waiting/confirming/sending are all
 * "pending" from our side; finished/confirmed credit; expired/failed/
 * refunded do not. */
export async function getPaymentStatus(providerPaymentId: string): Promise<PaymentStatusResult> {
  const apiKey = required("NOWPAYMENTS_API_KEY");
  const res = await fetch(`${API_BASE}/payment/${encodeURIComponent(providerPaymentId)}`, {
    headers: { "x-api-key": apiKey },
  });
  const data = await res.json().catch(() => ({}));
  console.log("[nowpayments:getPaymentStatus]", JSON.stringify(data));

  const status: string = data.payment_status ?? "";
  if (status === "finished" || status === "confirmed") {
    return { status: "completed", actuallyPaidUsd: Number(data.price_amount ?? data.actually_paid ?? 0) };
  }
  if (status === "failed" || status === "expired" || status === "refunded") {
    return { status: "failed", reason: status };
  }
  return { status: "pending" };
}

/** IPN payloads are signed with HMAC-SHA512 over the JSON body with its keys
 * sorted alphabetically at every level — verify before ever trusting one. */
export function verifyIpnSignature(body: Record<string, unknown>, headerSig: string | null): boolean {
  if (!headerSig) return false;
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret) return false;

  const sorted = sortKeysDeep(body);
  const payload = JSON.stringify(sorted);
  const expected = createHmac("sha512", secret).update(payload).digest("hex");

  const a = Buffer.from(headerSig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
        return acc;
      }, {} as Record<string, unknown>);
  }
  return value;
}
