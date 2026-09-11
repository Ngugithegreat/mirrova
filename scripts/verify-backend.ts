/**
 * Runs the real server logic (src/server/account.ts) against an in-memory
 * PGlite (WASM Postgres) instance — no live database needed. Verifies the
 * auth flow and the copy-trading money movements are correct before this
 * code ever touches a real Postgres instance.
 */
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import * as schema from "../src/db/schema";
import { signUp, logIn, logOut, getUserByToken, startCopy, stopCopy, getPortfolio } from "../src/server/account";
import { allocateReal, switchAccountType } from "../src/server/realAccount";
import { openPosition, listPositions, closePosition } from "../src/server/desk";
import { users, payments, deskPositions } from "../src/db/schema";
import { eq, and } from "drizzle-orm";
import { computeCopyValueCents } from "../src/lib/copyValue";
import { getTrader } from "../src/lib/traders";
import { getAccountType } from "../src/lib/accountTypes";
import { verifyAdminPassword, createAdminCookieValue, verifyAdminCookieValue, sign } from "../src/server/adminAuth";

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
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    const sql = readFileSync(join(dir, f), "utf8");
    for (const stmt of sql.split("--> statement-breakpoint")) {
      const trimmed = stmt.trim();
      if (trimmed) await client.exec(trimmed);
    }
  }

  const standardDemoCredit = getAccountType("standard").demoCreditCents;

  // --- signup ---
  const s1 = await signUp(db, "Alex Investor", "alex@example.com", "hunter22");
  check("signup succeeds", s1.ok && !!s1.token);

  const [alex] = await db.select().from(users).where(eq(users.email, "alex@example.com"));
  check("default signup (Standard) funds $10,000 practice balance", alex.cashCents === standardDemoCredit);
  check("Standard's demo credit is exactly 1,000,000 cents", standardDemoCredit === 1_000_000);
  check("default signup is stored as the Standard account type", alex.accountType === "standard");

  const s2 = await signUp(db, "Someone Else", "alex@example.com", "differentpw1");
  check("duplicate email rejected", !s2.ok);

  const s3 = await signUp(db, "Weak Pw", "weak@example.com", "short");
  check("short password rejected", !s3.ok);

  // --- login ---
  const l1 = await logIn(db, "alex@example.com", "hunter22");
  check("login with correct password succeeds", l1.ok && !!l1.token);

  const l2 = await logIn(db, "alex@example.com", "wrongpassword");
  check("login with wrong password rejected", !l2.ok);

  const l3 = await logIn(db, "nobody@example.com", "whatever1");
  check("login with unknown email rejected", !l3.ok);

  // --- session ---
  if (!s1.ok) throw new Error("no token from signup");
  const sessionUser = await getUserByToken(db, s1.token);
  check("session token resolves to the correct user", sessionUser?.email === "alex@example.com");

  const bogus = await getUserByToken(db, "not-a-real-token");
  check("bogus session token resolves to nothing", bogus === null);

  // --- copying ---
  const c1 = await startCopy(db, alex.id, "isabella-rossi", 100_000, 20, 10_000);
  check("start copy succeeds", c1.ok);

  const [afterCopy] = await db.select().from(users).where(eq(users.id, alex.id));
  check("starting a copy deducts cash", afterCopy.cashCents === standardDemoCredit - 100_000);

  const c2 = await startCopy(db, alex.id, "isabella-rossi", 100_000, 20, 10_000);
  check("copying the same trader twice is rejected", !c2.ok);

  const c3 = await startCopy(db, alex.id, "daniel-kim", 5_000, 20, 10_000);
  check("amount below trader minimum is rejected", !c3.ok);

  const c4 = await startCopy(db, alex.id, "daniel-kim", 999_999_999, 20, 10_000);
  check("insufficient cash is rejected", !c4.ok);

  const portfolio1 = await getPortfolio(db, alex.id);
  check("portfolio shows exactly one active copy", portfolio1.copies.length === 1);
  check("activity log recorded signup + start copy", portfolio1.activity.length === 2);

  const stopResult = await stopCopy(db, alex.id, "isabella-rossi");
  check("stop copy succeeds", stopResult.ok);

  const [afterStop] = await db.select().from(users).where(eq(users.id, alex.id));
  const expectedAfterStop = standardDemoCredit - 100_000 + (stopResult.ok ? stopResult.valueCents : 0);
  check("stopping a copy returns its value to cash", afterStop.cashCents === expectedAfterStop);

  const portfolio2 = await getPortfolio(db, alex.id);
  check("stopped copy no longer appears as active", portfolio2.copies.length === 0);

  const stopAgain = await stopCopy(db, alex.id, "isabella-rossi");
  check("stopping an already-stopped copy is rejected", !stopAgain.ok);

  // --- account types: chosen at signup, stored, not computed from deposits ---
  const typeSignup = await signUp(db, "Type Tester", "types@example.com", "hunter22", "standard");
  check("account-type-test signup succeeds", typeSignup.ok);
  const [typeUser] = await db.select().from(users).where(eq(users.email, "types@example.com"));
  check("a Standard signup gets exactly Standard's demo credit", typeUser.cashCents === standardDemoCredit);
  check("the chosen account type is stored on the user row", typeUser.accountType === "standard");

  // --- account types: concurrent-copy limit follows the chosen type ---
  const tc1 = await startCopy(db, typeUser.id, "elena-vasquez", 10_000, 20, 100);
  const tc2 = await startCopy(db, typeUser.id, "marcus-oduya", 10_000, 20, 100);
  const tc3 = await startCopy(db, typeUser.id, "yuki-tanaka", 10_000, 20, 100);
  const tc4 = await startCopy(db, typeUser.id, "sofia-lindqvist", 10_000, 20, 100);
  const tc5 = await startCopy(db, typeUser.id, "dmitri-petrov", 10_000, 20, 100);
  check("copies 1-5 succeed within Standard's limit of 5", [tc1, tc2, tc3, tc4, tc5].every((r) => r.ok));
  const tc6 = await startCopy(db, typeUser.id, "amara-nkosi", 10_000, 20, 100);
  check("a 6th concurrent copy is rejected past Standard's limit of 5", !tc6.ok);

  // --- account types: performance fee is per-trader only, no type-based discount ---
  const trader = getTrader("isabella-rossi")!;
  const backdated = new Date(Date.now() - 400 * 86_400_000);
  await db.insert(schema.copies).values({
    userId: typeUser.id,
    traderSlug: "isabella-rossi",
    amountCents: 100_000,
    stopLossPct: 90,
    startedAt: backdated,
  });
  const feeStop = await stopCopy(db, typeUser.id, "isabella-rossi");
  check("stopping the long-running copy succeeds", feeStop.ok);
  if (feeStop.ok) {
    const grossValueCents = computeCopyValueCents({
      slug: "isabella-rossi",
      amountCents: 100_000,
      stopLossPct: 90,
      startedAt: backdated,
    });
    const profitCents = Math.max(0, grossValueCents - 100_000);
    const expectedFee = Math.round((profitCents * trader.perfFee) / 100);
    check("performance fee equals trader.perfFee with no account-type discount", feeStop.feeCents === expectedFee);
    check("net value returned equals gross settlement minus the fee", feeStop.valueCents === grossValueCents - expectedFee);
    check("no fee is ever charged on a loss", profitCents > 0 || feeStop.feeCents === 0);
  }

  // --- account types: the minimum deposit gates real allocation ---
  const allocTooEarly = await allocateReal(db, typeUser.id, "isabella-rossi");
  check("allocating with $0 real balance is rejected", !allocTooEarly.ok);

  // Simulate a completed $20 deposit directly (below Standard's $50 minimum) —
  // completeDeposit() is bypassed here, so realCashCents is bumped by hand too.
  await db.insert(payments).values({
    userId: typeUser.id,
    status: "completed",
    kesCents: 260_000,
    creditedUsdCents: 2_000,
    phone: "0712345678",
    checkoutRequestId: "type-test-deposit-1",
  });
  await db.update(users).set({ realCashCents: 2_000 }).where(eq(users.id, typeUser.id));
  const allocBelowMin = await allocateReal(db, typeUser.id, "isabella-rossi");
  check("allocating below the account type's minimum deposit is rejected", !allocBelowMin.ok);

  // top up to $50 lifetime deposits — Standard's minimum
  await db.insert(payments).values({
    userId: typeUser.id,
    status: "completed",
    kesCents: 390_000,
    creditedUsdCents: 3_000,
    phone: "0712345678",
    checkoutRequestId: "type-test-deposit-2",
  });
  await db.update(users).set({ realCashCents: 5_000 }).where(eq(users.id, typeUser.id));
  const allocAtMin = await allocateReal(db, typeUser.id, "isabella-rossi");
  check("allocating at/above the account type's minimum deposit succeeds", allocAtMin.ok);

  // --- account types: switching requires clearing the target type's minimum ---
  const switchTooLow = await switchAccountType(db, typeUser.id, "pro");
  check("switching to Pro without meeting its $5,000 minimum is rejected", !switchTooLow.ok);

  await db.insert(payments).values({
    userId: typeUser.id,
    status: "completed",
    kesCents: 65_000_000,
    creditedUsdCents: 500_000, // $5,000, clearing Pro's minimum
    phone: "0712345678",
    checkoutRequestId: "type-test-deposit-3",
  });
  const switchOk = await switchAccountType(db, typeUser.id, "pro");
  check("switching to Pro after clearing its minimum succeeds", switchOk.ok);
  const [afterSwitch] = await db.select().from(users).where(eq(users.id, typeUser.id));
  check("the stored account type actually changed", afterSwitch.accountType === "pro");

  // --- the Desk: practice-only self-directed positions (Standard account) ---
  const deskSignup = await signUp(db, "Desk Tester", "desk@example.com", "hunter22", "standard");
  check("desk-test signup succeeds", deskSignup.ok);
  const [deskUser] = await db.select().from(users).where(eq(users.email, "desk@example.com"));

  const [beforeOpen] = await db.select().from(users).where(eq(users.id, deskUser.id));
  const open1 = await openPosition(db, deskUser.id, "BTC/USD", "long", 10_000);
  check("opening a position on an unlocked instrument succeeds for Standard", open1.ok);

  const [afterOpen] = await db.select().from(users).where(eq(users.id, deskUser.id));
  check("opening a position debits the exact stake from practice cash", afterOpen.cashCents === beforeOpen.cashCents - 10_000);

  const openLocked = await openPosition(db, deskUser.id, "EUR/USD", "long", 10_000);
  check("opening a position on a Standard-locked instrument (5th slot) is rejected", !openLocked.ok);

  const openSlTpAsStandard = await openPosition(db, deskUser.id, "ETH/USD", "long", 10_000, 1);
  check("stop-loss/take-profit orders are rejected for Standard", !openSlTpAsStandard.ok);

  const { open: openAfterFirst } = await listPositions(db, deskUser.id);
  check("exactly one open position exists", openAfterFirst.length === 1);
  check("the position uses Standard's 1:500 leverage", openAfterFirst[0].position.leverage === 500);

  const closeResult = await closePosition(db, deskUser.id, openAfterFirst[0].position.id);
  check("closing the position succeeds", closeResult.ok);
  if (closeResult.ok) {
    const [afterClose] = await db.select().from(users).where(eq(users.id, deskUser.id));
    check(
      "closing credits stake + P&L back to practice cash",
      afterClose.cashCents === afterOpen.cashCents + 10_000 + closeResult.pnlCents
    );
  }
  const { open: openAfterClose } = await listPositions(db, deskUser.id);
  check("closed position no longer appears as open", openAfterClose.length === 0);

  // --- the Desk: stop-loss auto-closes on read, credited correctly (Pro account) ---
  // typeUser was switched to Pro above, which unlocks all instruments and SL/TP.
  const slOpen = await openPosition(db, typeUser.id, "GOLD", "long", 20_000);
  check("a Pro account can open a position on an instrument beyond Standard's 4", slOpen.ok);
  const [slPos] = await db
    .select()
    .from(deskPositions)
    .where(and(eq(deskPositions.userId, typeUser.id), eq(deskPositions.instrument, "GOLD"), eq(deskPositions.active, true)));
  // Force a guaranteed trigger regardless of the live price's tiny wander, bypassing
  // openPosition's entry-relative sanity check (that check belongs to order entry, not
  // to proving listPositions' auto-close logic works once a threshold IS crossed).
  await db
    .update(deskPositions)
    .set({ stopLossPrice: slPos.entryPrice * 1000 })
    .where(eq(deskPositions.id, slPos.id));

  const [beforeAutoClose] = await db.select().from(users).where(eq(users.id, typeUser.id));
  const { open: openAfterSl, closed: closedAfterSl } = await listPositions(db, typeUser.id);
  check("the stop-loss position auto-closed on read", !openAfterSl.some((p) => p.position.id === slPos.id));
  check("the auto-closed position appears in recently-closed", closedAfterSl.some((p) => p.id === slPos.id));

  const [afterAutoClose] = await db.select().from(users).where(eq(users.id, typeUser.id));
  const closedRow = closedAfterSl.find((p) => p.id === slPos.id)!;
  check(
    "auto-close credited stake + P&L back to practice cash",
    afterAutoClose.cashCents === beforeAutoClose.cashCents + slPos.stakeUsdCents + (closedRow.pnlCents ?? 0)
  );

  // --- admin auth: stateless HMAC-signed cookie, no DB involved ---
  const priorAdminPassword = process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_PASSWORD;
  const unconfigured = verifyAdminPassword("anything");
  check("admin login fails closed when ADMIN_PASSWORD is unset", !unconfigured.ok);

  process.env.ADMIN_PASSWORD = "correct-horse-battery-staple";
  check("the correct admin password is accepted", verifyAdminPassword("correct-horse-battery-staple").ok);
  check("the wrong admin password is rejected", !verifyAdminPassword("wrong-password").ok);

  const freshCookie = createAdminCookieValue();
  check("a freshly created admin cookie verifies", verifyAdminCookieValue(freshCookie));
  check("no cookie value is rejected", !verifyAdminCookieValue(undefined));
  check("a garbage cookie value is rejected", !verifyAdminCookieValue("not-a-real-cookie"));

  const [ts, sig] = freshCookie.split(".");
  const tamperedSig = sig.slice(0, -1) + (sig.endsWith("0") ? "1" : "0");
  check("a tampered signature is rejected", !verifyAdminCookieValue(`${ts}.${tamperedSig}`));

  const expiredPayload = String(Date.now() - 1000);
  const expiredCookie = `${expiredPayload}.${sign(expiredPayload)}`;
  check("a correctly-signed but expired cookie is rejected", !verifyAdminCookieValue(expiredCookie));

  if (priorAdminPassword === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = priorAdminPassword;

  // --- logout ---
  await logOut(db, s1.token);
  const afterLogout = await getUserByToken(db, s1.token);
  check("logout invalidates the session token", afterLogout === null);

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
