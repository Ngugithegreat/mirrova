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
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { users, payments, realAllocations } from "../src/db/schema";
import { signUp } from "../src/server/account";
import { handleStkCallback, reconcileDeposit, getRealAccount, allocateReal, deallocateReal } from "../src/server/realAccount";

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

  // --- portfolio read ---
  const acct1 = await getRealAccount(db, user.id);
  check("real account shows the credited balance", acct1.realCashCents === 769);
  check("real account lists both payment attempts", acct1.payments.length === 2);
  check("no allocation yet", acct1.allocation === null);

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
  check("the allocation records the full amount", allocRow.amountCents === 769);
  check("the allocation is active", allocRow.active === true);

  const alloc2 = await allocateReal(db, user.id, "elena-vasquez");
  check("allocating again while one is already active is rejected", !alloc2.ok);

  const acct2 = await getRealAccount(db, user.id);
  check("real account now shows the active allocation", acct2.allocation?.traderSlug === "isabella-rossi");
  check("real account shows zero available (all allocated)", acct2.realCashCents === 0);

  // --- stopping returns exact principal, never invents a return ---
  const stop1 = await deallocateReal(db, user.id);
  check("stopping the real allocation succeeds", stop1.ok);

  const [afterStop] = await db.select().from(users).where(eq(users.id, user.id));
  check("stopping returns exactly the original principal — no fabricated gain/loss", afterStop.realCashCents === 769);

  const stop2 = await deallocateReal(db, user.id);
  check("stopping again with nothing active is rejected", !stop2.ok);

  // --- allocating a zero balance is rejected ---
  const [freshUser] = await signUp(db, "Zero Balance", "zero@example.com", "hunter22pw").then(async (r) => {
    if (!r.ok) throw new Error("signup failed");
    return db.select().from(users).where(eq(users.email, "zero@example.com"));
  });
  const allocZero = await allocateReal(db, freshUser.id, "isabella-rossi");
  check("allocating with zero real balance is rejected", !allocZero.ok);

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
