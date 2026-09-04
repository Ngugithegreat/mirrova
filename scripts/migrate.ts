/** Applies drizzle/*.sql to the database at DATABASE_URL. Run once per deploy of a new migration. */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

function cleanUrl(url: string) {
  return url.replace(/([?&])channel_binding=require&?/, "$1").replace(/[?&]$/, "");
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Set DATABASE_URL before running migrations.");

  const sql = postgres(cleanUrl(url), { max: 1 });
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: "./drizzle" });
  await sql.end();
  console.log("Migrations applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
