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
import { signUp, logIn, logOut, getUserByToken, startCopy, stopCopy, getPortfolio, START_CASH_CENTS } from "../src/server/account";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";

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

  // --- signup ---
  const s1 = await signUp(db, "Alex Investor", "alex@example.com", "hunter22");
  check("signup succeeds", s1.ok && !!s1.token);

  const [alex] = await db.select().from(users).where(eq(users.email, "alex@example.com"));
  check("signup funds $100,000 practice balance", alex.cashCents === START_CASH_CENTS);
  check("signup funds exactly 10,000,000 cents", START_CASH_CENTS === 10_000_000);

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
  check("starting a copy deducts cash", afterCopy.cashCents === START_CASH_CENTS - 100_000);

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
  const expectedAfterStop = START_CASH_CENTS - 100_000 + (stopResult.ok ? stopResult.valueCents : 0);
  check("stopping a copy returns its value to cash", afterStop.cashCents === expectedAfterStop);

  const portfolio2 = await getPortfolio(db, alex.id);
  check("stopped copy no longer appears as active", portfolio2.copies.length === 0);

  const stopAgain = await stopCopy(db, alex.id, "isabella-rossi");
  check("stopping an already-stopped copy is rejected", !stopAgain.ok);

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
