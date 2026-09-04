/**
 * Temporary local Postgres-wire-protocol server backed by PGlite, so the
 * real Next.js dev server can be pointed at a real DATABASE_URL for true
 * end-to-end testing — without needing a live Neon/Postgres instance.
 * Dev-only convenience; not used in production (never imported by the app).
 */
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const db = new PGlite();
const dir = join(__dirname, "..", "drizzle");
for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) {
  const sql = readFileSync(join(dir, f), "utf8");
  for (const stmt of sql.split("--> statement-breakpoint")) {
    const trimmed = stmt.trim();
    if (trimmed) await db.exec(trimmed);
  }
}

const server = new PGLiteSocketServer({ db, port: 55432, host: "127.0.0.1" });
await server.start();
console.log("Local PGlite Postgres server listening on postgres://127.0.0.1:55432/postgres");
