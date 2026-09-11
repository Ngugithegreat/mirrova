import { pgTable, text, integer, timestamp, uuid, boolean, doublePrecision } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  cashCents: integer("cash_cents").notNull(), // practice balance, USD minor units
  realCashCents: integer("real_cash_cents").notNull().default(0), // real, unallocated USD minor units — actual M-Pesa deposits
  accountType: text("account_type").notNull().default("standard"), // standard | ecn | pro | swapFree — chosen at signup, switchable later
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const copies = pgTable("copies", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  traderSlug: text("trader_slug").notNull(),
  amountCents: integer("amount_cents").notNull(),
  stopLossPct: integer("stop_loss_pct").notNull(),
  active: boolean("active").notNull().default(true),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  stoppedAt: timestamp("stopped_at", { withTimezone: true }),
});

export const activity = pgTable("activity", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Real-money M-Pesa deposits. One row per STK push attempt. */
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending | completed | failed
  kesCents: integer("kes_cents").notNull(),
  fxRate: doublePrecision("fx_rate"), // USD/KES rate used, set on completion
  creditedUsdCents: integer("credited_usd_cents"), // set on completion
  phone: text("phone").notNull(),
  checkoutRequestId: text("checkout_request_id").notNull().unique(),
  merchantRequestId: text("merchant_request_id"),
  mpesaReceipt: text("mpesa_receipt"),
  resultDesc: text("result_desc"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

/**
 * A real allocation is all-or-nothing by design: depositing and copying with
 * real money means the client's entire available real balance goes to one
 * strategist at a time — never a partial amount, and never split.
 */
export const realAllocations = pgTable("real_allocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  traderSlug: text("trader_slug").notNull(),
  amountCents: integer("amount_cents").notNull(),
  active: boolean("active").notNull().default(true),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  stoppedAt: timestamp("stopped_at", { withTimezone: true }),
});

/** Self-directed practice-money positions on the Desk — entirely separate
 * from copy-trading. Always settled against `cashCents` (practice), never
 * `realCashCents`. Simulated leverage only; no real funds at risk. */
export const deskPositions = pgTable("desk_positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  instrument: text("instrument").notNull(),
  side: text("side").notNull(), // "long" | "short"
  stakeUsdCents: integer("stake_usd_cents").notNull(),
  leverage: integer("leverage").notNull(),
  entryPrice: doublePrecision("entry_price").notNull(),
  stopLossPrice: doublePrecision("stop_loss_price"),
  takeProfitPrice: doublePrecision("take_profit_price"),
  active: boolean("active").notNull().default(true),
  openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  closePrice: doublePrecision("close_price"),
  pnlCents: integer("pnl_cents"),
});

/** A withdrawal request debits realCashCents immediately (funds are locked
 * the moment a request is made, same "commit first" pattern as
 * realAllocations) — paid out manually since there's no automated payout
 * rail; rejecting one refunds realCashCents since the lock was provisional. */
export const withdrawals = pgTable("withdrawals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amountUsdCents: integer("amount_usd_cents").notNull(),
  phone: text("phone").notNull(),
  status: text("status").notNull().default("pending"), // pending | paid | rejected
  note: text("note"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});
