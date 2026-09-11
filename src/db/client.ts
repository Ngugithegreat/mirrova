import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

/** Neon's channel_binding=require breaks postgres.js (every query 500s). Strip it. */
function cleanUrl(url: string) {
  return url.replace(/([?&])channel_binding=require&?/, "$1").replace(/[?&]$/, "");
}

const g = globalThis as unknown as { __asportSql?: ReturnType<typeof postgres> };

function client() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Create a Postgres database (e.g. Neon) and set DATABASE_URL in your environment."
    );
  }
  if (!g.__asportSql) {
    g.__asportSql = postgres(cleanUrl(url), { prepare: false });
  }
  return g.__asportSql;
}

export function getDb() {
  return drizzle(client(), { schema });
}
