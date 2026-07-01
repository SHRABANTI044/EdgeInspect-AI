import pg from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:database850@127.0.0.1:5432/postgres";

const client = new pg.Client({ connectionString: DATABASE_URL });

try {
  await client.connect();
  await client.query("CREATE DATABASE app_db;");
  console.log("database ensured: app_db");
} catch (err) {
  if ((err?.code ?? "") === "42P04") {
    console.log("database already exists: app_db");
    process.exit(0);
  }
  console.error("create db failed", err);
  process.exit(1);
} finally {
  await client.end();
}
