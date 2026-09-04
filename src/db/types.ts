import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

/** Server logic is written against this so it runs identically against real
 * Postgres (production) and PGlite (local verification, no live DB needed). */
export type AppDb = PostgresJsDatabase<typeof schema> | PgliteDatabase<typeof schema>;
