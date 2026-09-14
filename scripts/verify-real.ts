/**
 * Verifies the real-money wallet logic (deposit settlement, idempotency,
 * all-or-nothing allocation) against an in-memory PGlite instance.
 *
 * This does NOT call the real Safaricom API — stkPush/stkQuery need a live
 * phone to enter an M-Pesa PIN, which no automated test can do. What's
 * verified here is everything downstream of that: once Safaricom confirms a
 * result (via callback or status query), is the money math and database
 * state correct, and is it safe against being told the same result twice?
 */
process.env.USD_KES_RATE = "130"; // fixed rate so the math is deterministic

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { eq, and, sql } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { users, payments, cryptoPayments, realAllocations } from "../src/db/schema";
import { signUp } from "../src/server/account";
import { handleStkCallback, reconcileDeposit, getRealAccount, allocateReal, deallocateReal, grantBonus } from "../src/server/realAccount";
import { handleCryptoIpn, reconcileCryptoDeposit } from "../src/server/cryptoDeposits";
import { getEngineView, tickEngine, forceRolloverAllTraders, blowIllustrativeEquity, adminOpenPosition, adminClosePosition } from "../src/server/copyEngine";
import { setWinRatePct, setRiskPct } from "../src/server/settings";
import { forceCreditDeposit } from "../src/server/realAccount";
import { forceCreditCryptoDeposit } from "../src/server/cryptoDeposits";
import { createProvider } from "../src/server/providers";

let passed = 0;
let failed = 0;

function check(label: string, cond: boolean) {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${label}`);
  }
}

async function main() {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  const dir = join(__dirname, "..", "drizzle");
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) {
    const sql = readFileSync(join(dir, f), "utf8");
    for (const stmt of sql.split("--> statement-breakpoint")) {
      const trimmed = stmt.trim();
      if (trimmed) await client.exec(trimmed);
    }
  }

  const s = await signUp(db, "Real Money Tester", "realtest@example.com", "hunter22pw");
  if (!s.ok) throw new Error("signup failed");
  const [user] = await db.select().from(users).where(eq(users.email, "realtest@example.com"));

  check("new user starts with zero real balance", user.realCashCents === 0);

  // --- a completed deposit ---
  await db.insert(payments).values({
    userId: user.id,
    phone: "254712345678",
    kesCents: 100_000, // KES 1,000.00
    checkoutRequestId: "test-checkout-1",
    status: "pending",
  });

  await handleStkCallback(db, "test-checkout-1", 0, "The service request is processed successfully.", "RCPT1234");

  const [p1] = await db.select().from(payments).where(eq(payments.checkoutRequestId, "test-checkout-1"));
  check("completed payment is marked completed", p1.status === "completed");
  check("fx rate recorded", p1.fxRate === 130);
  check("USD credited at KES 1,000 / 130 = $7.69 (769 cents)", p1.creditedUsdCents === 769);
  check("mpesa receipt recorded", p1.mpesaReceipt === "RCPT1234");

  const [afterDeposit] = await db.select().from(users).where(eq(users.id, user.id));
  check("real balance credited by the USD amount", afterDeposit.realCashCents === 769);

  // --- idempotency: the callback AND a status reconciliation could both fire ---
  await handleStkCallback(db, "test-checkout-1", 0, "duplicate delivery", "RCPT1234");
  const [afterDuplicate] = await db.select().from(users).where(eq(users.id, user.id));
  check("a duplicate settlement never double-credits", afterDuplicate.realCashCents === 769);

  const reconciled = await reconcileDeposit(db, "test-checkout-1");
  check("reconciling an already-completed payment is a no-op", reconciled.ok && reconciled.status === "completed");
  const [afterReconcile] = await db.select().from(users).where(eq(users.id, user.id));
  check("reconciling an already-completed payment still doesn't double-credit", afterReconcile.realCashCents === 769);

  // --- a failed deposit ---
  await db.insert(payments).values({
    userId: user.id,
    phone: "254712345678",
    kesCents: 50_000,
    checkoutRequestId: "test-checkout-2",
    status: "pending",
  });
  await handleStkCallback(db, "test-checkout-2", 1032, "Request cancelled by user");
  const [p2] = await db.select().from(payments).where(eq(payments.checkoutRequestId, "test-checkout-2"));
  check("failed payment is marked failed", p2.status === "failed");
  const [afterFailed] = await db.select().from(users).where(eq(users.id, user.id));
  check("a failed deposit credits nothing", afterFailed.realCashCents === 769);

  // --- a completed crypto deposit ---
  await db.insert(cryptoPayments).values({
    userId: user.id,
    providerPaymentId: "test-crypto-1",
    payCurrency: "usdttrc20",
    priceAmountUsd: 25,
    payAddress: "TAbc123FakeAddress",
    status: "pending",
  });

  await handleCryptoIpn(db, "test-crypto-1", "finished", 25);

  const [cp1] = await db.select().from(cryptoPayments).where(eq(cryptoPayments.providerPaymentId, "test-crypto-1"));
  check("completed crypto payment is marked completed", cp1.status === "completed");
  check("crypto USD credited 1:1 for a stablecoin", cp1.creditedUsdCents === 2500);

  const [afterCryptoDeposit] = await db.select().from(users).where(eq(users.id, user.id));
  check("real balance credited by the crypto USD amount", afterCryptoDeposit.realCashCents === 769 + 2500);

  // --- idempotency: the IPN AND a status reconciliation could both fire ---
  await handleCryptoIpn(db, "test-crypto-1", "finished", 25);
  const [afterCryptoDuplicate] = await db.select().from(users).where(eq(users.id, user.id));
  check("a duplicate crypto settlement never double-credits", afterCryptoDuplicate.realCashCents === 769 + 2500);

  const cryptoReconciled = await reconcileCryptoDeposit(db, "test-crypto-1");
  check("reconciling an already-completed crypto payment is a no-op", cryptoReconciled.ok && cryptoReconciled.status === "completed");
  const [afterCryptoReconcile] = await db.select().from(users).where(eq(users.id, user.id));
  check("reconciling an already-completed crypto payment still doesn't double-credit", afterCryptoReconcile.realCashCents === 769 + 2500);

  // --- a failed crypto deposit ---
  await db.insert(cryptoPayments).values({
    userId: user.id,
    providerPaymentId: "test-crypto-2",
    payCurrency: "usdttrc20",
    priceAmountUsd: 30,
    payAddress: "TAbc123FakeAddress2",
    status: "pending",
  });
  await handleCryptoIpn(db, "test-crypto-2", "failed");
  const [cp2] = await db.select().from(cryptoPayments).where(eq(cryptoPayments.providerPaymentId, "test-crypto-2"));
  check("failed crypto payment is marked failed", cp2.status === "failed");
  const [afterCryptoFailed] = await db.select().from(users).where(eq(users.id, user.id));
  check("a failed crypto deposit credits nothing", afterCryptoFailed.realCashCents === 769 + 2500);

  // --- portfolio read ---
  const acct1 = await getRealAccount(db, user.id);
  check("real account shows the credited balance", acct1.realCashCents === 769 + 2500);
  check("real account lists both mpesa payment attempts", acct1.payments.length === 2);
  check("real account lists both crypto payment attempts", acct1.cryptoPayments.length === 2);
  check("no allocation yet", acct1.allocation === null);

  // --- account types: allocation now also requires clearing the account
  // type's minimum lifetime deposit (Standard = $50) — the $32.69 credited
  // above (mpesa + crypto) is deliberately too small to activate real
  // copying on its own.
  const allocBelowMin = await allocateReal(db, user.id, "isabella-rossi");
  check("allocating below Standard's $50 minimum deposit is rejected", !allocBelowMin.ok);

  await db.insert(payments).values({
    userId: user.id,
    phone: "254712345678",
    kesCents: 1_000_000, // KES 10,000.00
    checkoutRequestId: "test-checkout-3",
    status: "pending",
  });
  await handleStkCallback(db, "test-checkout-3", 0, "The service request is processed successfully.", "RCPT5678");
  const [afterTopUp] = await db.select().from(users).where(eq(users.id, user.id));
  const totalRealCents = afterTopUp.realCashCents; // 769 + 2,500 + 7,692 — clears the $50 minimum
  check("the top-up deposit clears Standard's $50 minimum", totalRealCents >= 5000);

  // --- allocation is all-or-nothing ---
  const allocBad = await allocateReal(db, user.id, "not-a-real-trader");
  check("allocating to an unknown trader is rejected", !allocBad.ok);

  const alloc1 = await allocateReal(db, user.id, "isabella-rossi");
  check("allocating the full real balance succeeds", alloc1.ok);

  const [afterAlloc] = await db.select().from(users).where(eq(users.id, user.id));
  check("allocating moves the ENTIRE balance out (none left available)", afterAlloc.realCashCents === 0);

  const [allocRow] = await db
    .select()
    .from(realAllocations)
    .where(eq(realAllocations.userId, user.id));
  check("the allocation records the full amount", allocRow.amountCents === totalRealCents);
  check("the allocation is active", allocRow.active === true);

  const alloc2 = await allocateReal(db, user.id, "elena-vasquez");
  check("allocating again while one is already active is rejected", !alloc2.ok);

  const acct2 = await getRealAccount(db, user.id);
  check("real account now shows the active allocation", acct2.allocation?.traderSlug === "isabella-rossi");
  check("real account shows zero available (all allocated)", acct2.realCashCents === 0);

  // --- paper-settlement engine: opens/mirrors illustrative positions, and
  // NEVER touches real money regardless of simulated P&L ---
  const engineView1 = await getEngineView(db, user.id);
  check("the engine opens an illustrative position once allocated", engineView1.open !== null);
  check(
    "the mirrored position size is a fraction of the allocation, never the full amount",
    engineView1.open !== null && engineView1.open.sizeUsdCents > 0 && engineView1.open.sizeUsdCents <= allocRow.amountCents
  );

  const [providerPosRow] = await db.select().from(schema.providerPositions).where(eq(schema.providerPositions.traderSlug, "isabella-rossi"));
  check("a provider_positions row was created for the trader", !!providerPosRow);

  const [copyPosRow] = await db.select().from(schema.copyPositions).where(eq(schema.copyPositions.userId, user.id));
  check("a copy_positions row mirrors it for this user's allocation", copyPosRow?.providerPositionId === providerPosRow?.id);

  const [userBeforeTick] = await db.select().from(users).where(eq(users.id, user.id));
  const [allocBeforeTick] = await db.select().from(realAllocations).where(eq(realAllocations.id, allocRow.id));

  // Force the current position to look stale (as if its time bucket has
  // elapsed) and re-tick — no need to wait out the real bucket duration.
  await db.update(schema.providerPositions).set({ bucket: providerPosRow.bucket - 1 }).where(eq(schema.providerPositions.id, providerPosRow.id));
  await tickEngine(db, "isabella-rossi");

  const [closedProviderPos] = await db.select().from(schema.providerPositions).where(eq(schema.providerPositions.id, providerPosRow.id));
  check("re-ticking after the bucket elapses closes the old position", closedProviderPos.active === false);

  const [closedCopyPos] = await db.select().from(schema.copyPositions).where(eq(schema.copyPositions.id, copyPosRow.id));
  check(
    "closing the provider position also closes and settles its mirrored copy",
    closedCopyPos.active === false && closedCopyPos.realizedPnlCents !== null
  );

  const [userAfterTick] = await db.select().from(users).where(eq(users.id, user.id));
  const [allocAfterTick] = await db.select().from(realAllocations).where(eq(realAllocations.id, allocRow.id));
  check("engine ticks never touch users.realCashCents, regardless of simulated P&L", userAfterTick.realCashCents === userBeforeTick.realCashCents);
  check(
    "engine ticks never touch realAllocations.amountCents, regardless of simulated P&L",
    allocAfterTick.amountCents === allocBeforeTick.amountCents
  );

  const engineView2 = await getEngineView(db, user.id);
  check("a fresh position opens for the new bucket right after the old one closes", engineView2.open !== null);
  check("the closed position appears in the recently-closed list", engineView2.recentlyClosed.length >= 1);

  // --- admin win-rate dial: deterministically engineers the designed
  // outcome, proving the testing dial actually controls results ---
  await setWinRatePct(db, 100);
  const winUser = await signUp(db, "Win Rate Tester", "winrate@example.com", "hunter22pw").then(async (r) => {
    if (!r.ok) throw new Error("signup failed");
    const [u] = await db.select().from(users).where(eq(users.email, "winrate@example.com"));
    return u;
  });
  await db.update(users).set({ realCashCents: 100_000 }).where(eq(users.id, winUser.id));
  await db.insert(payments).values({
    userId: winUser.id,
    phone: "254712345678",
    kesCents: 1_000_000,
    checkoutRequestId: "test-checkout-winrate",
    status: "completed",
    creditedUsdCents: 100_000,
  });
  await allocateReal(db, winUser.id, "elena-vasquez");
  await getEngineView(db, winUser.id); // opens the illustrative position
  const [winPos] = await db.select().from(schema.providerPositions).where(eq(schema.providerPositions.traderSlug, "elena-vasquez"));
  check("a position opened for the 100% win-rate test", !!winPos);
  await db.update(schema.providerPositions).set({ bucket: winPos.bucket - 1 }).where(eq(schema.providerPositions.id, winPos.id));
  await getEngineView(db, winUser.id); // discovers the bucket rollover and closes it
  const [winClosedCopy] = await db
    .select()
    .from(schema.copyPositions)
    .where(and(eq(schema.copyPositions.userId, winUser.id), eq(schema.copyPositions.active, false)));
  check("with winRatePct=100, the illustrative position always closes in profit", (winClosedCopy?.realizedPnlCents ?? -1) > 0);

  await setWinRatePct(db, 0);
  const loseUser = await signUp(db, "Lose Rate Tester", "loserate@example.com", "hunter22pw").then(async (r) => {
    if (!r.ok) throw new Error("signup failed");
    const [u] = await db.select().from(users).where(eq(users.email, "loserate@example.com"));
    return u;
  });
  await db.update(users).set({ realCashCents: 100_000 }).where(eq(users.id, loseUser.id));
  await db.insert(payments).values({
    userId: loseUser.id,
    phone: "254712345678",
    kesCents: 1_000_000,
    checkoutRequestId: "test-checkout-loserate",
    status: "completed",
    creditedUsdCents: 100_000,
  });
  await allocateReal(db, loseUser.id, "daniel-kim");
  await getEngineView(db, loseUser.id);
  const [losePos] = await db.select().from(schema.providerPositions).where(eq(schema.providerPositions.traderSlug, "daniel-kim"));
  check("a position opened for the 0% win-rate test", !!losePos);
  await db.update(schema.providerPositions).set({ bucket: losePos.bucket - 1 }).where(eq(schema.providerPositions.id, losePos.id));
  await getEngineView(db, loseUser.id);
  const [loseClosedCopy] = await db
    .select()
    .from(schema.copyPositions)
    .where(and(eq(schema.copyPositions.userId, loseUser.id), eq(schema.copyPositions.active, false)));
  check("with winRatePct=0, the illustrative position always closes at a loss", (loseClosedCopy?.realizedPnlCents ?? 1) < 0);

  // --- admin risk dial: at max risk, trade magnitude is scaled up too, not
  // just position size — proves the "trades close in cents" fix actually
  // took effect (magnitude scales with riskPct, see copyEngine.ts) ---
  await setWinRatePct(db, 100);
  await setRiskPct(db, 100);
  const riskUser = await signUp(db, "Risk Dial Tester", "riskdial@example.com", "hunter22pw").then(async (r) => {
    if (!r.ok) throw new Error("signup failed");
    const [u] = await db.select().from(users).where(eq(users.email, "riskdial@example.com"));
    return u;
  });
  await db.update(users).set({ realCashCents: 100_000 }).where(eq(users.id, riskUser.id));
  await db.insert(payments).values({
    userId: riskUser.id,
    phone: "254712345678",
    kesCents: 1_000_000,
    checkoutRequestId: "test-checkout-riskdial",
    status: "completed",
    creditedUsdCents: 100_000,
  });
  await allocateReal(db, riskUser.id, "yuki-tanaka");
  await getEngineView(db, riskUser.id);
  const [riskPos] = await db.select().from(schema.providerPositions).where(eq(schema.providerPositions.traderSlug, "yuki-tanaka"));
  check("a position opened for the max-risk magnitude test", !!riskPos);
  const [riskCopyOpen] = await db.select().from(schema.copyPositions).where(eq(schema.copyPositions.userId, riskUser.id));
  await db.update(schema.providerPositions).set({ bucket: riskPos.bucket - 1 }).where(eq(schema.providerPositions.id, riskPos.id));
  await getEngineView(db, riskUser.id);
  const [riskClosedCopy] = await db
    .select()
    .from(schema.copyPositions)
    .where(and(eq(schema.copyPositions.userId, riskUser.id), eq(schema.copyPositions.active, false)));
  check(
    "at riskPct=100, realized P&L is at least 1.5% of the mirrored size (proves magnitude scales with risk, not just position size)",
    Math.abs(riskClosedCopy?.realizedPnlCents ?? 0) >= (riskCopyOpen?.sizeUsdCents ?? 0) * 0.015
  );
  await setRiskPct(db, 50); // restore default for the rest of the suite

  // --- admin dial changes apply immediately, not up-to-15-minutes later:
  // forceRolloverAllTraders closes the open position without waiting for
  // the bucket to naturally elapse ---
  const [rolloverPosBefore] = await db
    .select()
    .from(schema.providerPositions)
    .where(and(eq(schema.providerPositions.traderSlug, "elena-vasquez"), eq(schema.providerPositions.active, true)));
  check("a position is open for the rollover test (from the earlier win-rate test)", !!rolloverPosBefore);
  await forceRolloverAllTraders(db);
  const [rolloverPosAfterClose] = await db
    .select()
    .from(schema.providerPositions)
    .where(eq(schema.providerPositions.id, rolloverPosBefore.id));
  check("forceRolloverAllTraders closes the open position without waiting for its bucket to elapse", rolloverPosAfterClose.active === false);
  await getEngineView(db, winUser.id);
  const [rolloverPosAfterReopen] = await db
    .select()
    .from(schema.providerPositions)
    .where(and(eq(schema.providerPositions.traderSlug, "elena-vasquez"), eq(schema.providerPositions.active, true)));
  check("a fresh position opens right after the forced rollover, on the very next read", !!rolloverPosAfterReopen);

  // --- admin "blow account" (illustrative-only): crashes equity to exactly
  // $0 via a synthetic trade-history entry, WITHOUT ever touching the real
  // balance or allocated principal ---
  const [riskUserBefore] = await db.select().from(users).where(eq(users.id, riskUser.id));
  const [riskAllocBefore] = await db
    .select()
    .from(realAllocations)
    .where(and(eq(realAllocations.userId, riskUser.id), eq(realAllocations.active, true)));
  const blowResult = await blowIllustrativeEquity(db, riskUser.id);
  check("blowing illustrative equity succeeds", blowResult.ok);
  const [{ totalAfterBlow }] = await db
    .select({ totalAfterBlow: sql<number>`coalesce(sum(${schema.copyPositions.realizedPnlCents}), 0)` })
    .from(schema.copyPositions)
    .where(and(eq(schema.copyPositions.realAllocationId, riskAllocBefore.id), eq(schema.copyPositions.active, false)));
  check(
    "illustrative equity (principal + cumulative realized P&L) is exactly $0 after blowing",
    riskAllocBefore.amountCents + Number(totalAfterBlow) === 0
  );
  const [riskUserAfter] = await db.select().from(users).where(eq(users.id, riskUser.id));
  check("blowing illustrative equity never touches the real balance", riskUserAfter.realCashCents === riskUserBefore.realCashCents);
  const [riskAllocAfter] = await db.select().from(realAllocations).where(eq(realAllocations.id, riskAllocBefore.id));
  check(
    "blowing illustrative equity never touches the allocated principal",
    riskAllocAfter.amountCents === riskAllocBefore.amountCents
  );
  const [noAllocUser] = await signUp(db, "No Allocation", "noalloc@example.com", "hunter22pw").then(async (r) => {
    if (!r.ok) throw new Error("signup failed");
    return db.select().from(users).where(eq(users.email, "noalloc@example.com"));
  });
  const blowMissingUser = await blowIllustrativeEquity(db, noAllocUser.id);
  check("blowing a user with no active real allocation is rejected", !blowMissingUser.ok);

  // --- stopping returns exact principal, never invents a return ---
  const stop1 = await deallocateReal(db, user.id);
  check("stopping the real allocation succeeds", stop1.ok);

  const [afterStop] = await db.select().from(users).where(eq(users.id, user.id));
  check("stopping returns exactly the original principal — no fabricated gain/loss", afterStop.realCashCents === totalRealCents);

  const stop2 = await deallocateReal(db, user.id);
  check("stopping again with nothing active is rejected", !stop2.ok);

  // --- allocating a zero balance is rejected ---
  const [freshUser] = await signUp(db, "Zero Balance", "zero@example.com", "hunter22pw").then(async (r) => {
    if (!r.ok) throw new Error("signup failed");
    return db.select().from(users).where(eq(users.email, "zero@example.com"));
  });
  const allocZero = await allocateReal(db, freshUser.id, "isabella-rossi");
  check("allocating with zero real balance is rejected", !allocZero.ok);

  // --- admin-granted bonus credits realCashCents directly, audited ---
  const bonusResult = await grantBonus(db, freshUser.id, 2_500, "welcome bonus");
  check("granting a bonus succeeds", bonusResult.ok);
  const [afterBonus] = await db.select().from(users).where(eq(users.id, freshUser.id));
  check("the bonus is credited to realCashCents", afterBonus.realCashCents === 2_500);
  const [bonusRow] = await db.select().from(schema.bonusGrants).where(eq(schema.bonusGrants.userId, freshUser.id));
  check("the bonus is recorded in the audit table", bonusRow?.amountCents === 2_500 && bonusRow?.note === "welcome bonus");
  const bonusBad = await grantBonus(db, freshUser.id, -100);
  check("granting a non-positive bonus is rejected", !bonusBad.ok);

  // --- admin manual engine controls (open/close a position on demand) ---
  const [manualUser] = await signUp(db, "Manual Engine Tester", "manualengine@example.com", "hunter22pw").then(async (r) => {
    if (!r.ok) throw new Error("signup failed");
    return db.select().from(users).where(eq(users.email, "manualengine@example.com"));
  });
  await db.insert(payments).values({
    userId: manualUser.id,
    phone: "254712345678",
    kesCents: 1_000_000, // KES 10,000 — comfortably clears the $50 standard-account minimum
    checkoutRequestId: "test-checkout-manual-engine",
    status: "pending",
  });
  await handleStkCallback(db, "test-checkout-manual-engine", 0, "Success", "MANUALRCPT");
  const manualAlloc = await allocateReal(db, manualUser.id, "sofia-lindqvist");
  check("funding and allocating the manual-engine test user succeeds", manualAlloc.ok);

  const openMissingTrader = await adminOpenPosition(db, "no-such-trader", "EUR/USD", "long");
  check("admin-opening a position for an unknown trader is rejected", !openMissingTrader.ok);

  const manualOpen = await adminOpenPosition(db, "sofia-lindqvist", "EUR/USD", "long");
  check("admin manually opening a position succeeds", manualOpen.ok);
  const [manualPos] = await db
    .select()
    .from(schema.providerPositions)
    .where(and(eq(schema.providerPositions.traderSlug, "sofia-lindqvist"), eq(schema.providerPositions.active, true)));
  check("the manually opened position has the admin-chosen instrument and side", manualPos?.instrument === "EUR/USD" && manualPos?.side === "long");
  const [manualMirror] = await db.select().from(schema.copyPositions).where(eq(schema.copyPositions.providerPositionId, manualPos.id));
  check("the manually opened position is immediately mirrored to the active allocation", !!manualMirror);

  const openAgain = await adminOpenPosition(db, "sofia-lindqvist", "GBP/USD", "short");
  check("admin cannot open a second position for a trader that already has one open", !openAgain.ok);

  const closeUnknown = await adminClosePosition(db, "00000000-0000-0000-0000-000000000000");
  check("admin-closing an unknown position is rejected", !closeUnknown.ok);

  const manualClose = await adminClosePosition(db, manualPos.id);
  check("admin manually closing a position succeeds", manualClose.ok);
  const [manualPosAfter] = await db.select().from(schema.providerPositions).where(eq(schema.providerPositions.id, manualPos.id));
  check("the manually closed position is no longer active", manualPosAfter.active === false);
  const closeAgain = await adminClosePosition(db, manualPos.id);
  check("admin cannot close an already-closed position again", !closeAgain.ok);
  const [manualUserAfterClose] = await db.select().from(users).where(eq(users.id, manualUser.id));
  check("admin manual open/close never touches the real balance", manualUserAfterClose.realCashCents === 0);

  // A manually opened position also works for a brand-new admin-added provider.
  const engineProvider = await createProvider(db, {
    name: "Engine Test Provider",
    country: "Kenya",
    strategy: "Test",
    style: "Balanced",
    markets: ["Crypto"],
    bio: "",
    perfFee: 10,
    minCopy: 50,
    winRate: 55,
    verified: true,
  });
  check("creating a provider for the engine test succeeds", engineProvider.ok);
  if (engineProvider.ok) {
    const openForAdminProvider = await adminOpenPosition(db, engineProvider.slug, "BTC/USD", "long");
    check("admin can open a position for a brand-new admin-added provider", openForAdminProvider.ok);
  }

  // --- admin force-credit override for a stuck deposit ---
  const [stuckUser] = await signUp(db, "Stuck Deposit Tester", "stuckdeposit@example.com", "hunter22pw").then(async (r) => {
    if (!r.ok) throw new Error("signup failed");
    return db.select().from(users).where(eq(users.email, "stuckdeposit@example.com"));
  });
  await db.insert(payments).values({
    userId: stuckUser.id,
    phone: "254712345678",
    kesCents: 130_00,
    checkoutRequestId: "test-checkout-stuck",
    status: "failed",
    resultDesc: "Timeout — provider lost the record",
  });
  const forceCredit = await forceCreditDeposit(db, "test-checkout-stuck");
  check("force-crediting a stuck (failed) deposit succeeds", forceCredit.ok);
  const [stuckUserAfter] = await db.select().from(users).where(eq(users.id, stuckUser.id));
  check("force-crediting actually credits the real balance", stuckUserAfter.realCashCents === (forceCredit.ok ? forceCredit.creditedUsdCents : -1));
  const forceCreditAgain = await forceCreditDeposit(db, "test-checkout-stuck");
  check("force-crediting an already-completed deposit is rejected (no double-credit)", !forceCreditAgain.ok);
  const forceCreditUnknown = await forceCreditDeposit(db, "no-such-checkout");
  check("force-crediting an unknown payment is rejected", !forceCreditUnknown.ok);

  await db.insert(cryptoPayments).values({
    userId: stuckUser.id,
    providerPaymentId: "test-crypto-stuck",
    payCurrency: "usdttrc20",
    priceAmountUsd: 20,
    payAddress: "TTestAddress",
    status: "pending",
  });
  const forceCreditCrypto = await forceCreditCryptoDeposit(db, "test-crypto-stuck");
  check("force-crediting a stuck (pending) crypto deposit succeeds", forceCreditCrypto.ok);
  const forceCreditCryptoAgain = await forceCreditCryptoDeposit(db, "test-crypto-stuck");
  check("force-crediting an already-completed crypto deposit is rejected", !forceCreditCryptoAgain.ok);

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
