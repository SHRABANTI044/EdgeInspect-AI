import pg from "pg";
import bcrypt from "bcryptjs";

const url =
  process.env.DATABASE_URL ||
  "postgresql://postgres:database850@127.0.0.1:5432/app_db";

const seedAccounts = [
  {
    email: "inspector@edgeinspect.ai",
    name: "Chief Inspector Reyes",
    password: "inspect2026",
    role: "ADMIN",
    org: "EdgeInspect Aerospace",
  },
  {
    email: "engineer@edgeinspect.ai",
    name: "Structural Engineer Lin",
    password: "aero2026",
    role: "INSPECTOR",
    org: "EdgeInspect Aerospace",
  },
];

const client = new pg.Client({ connectionString: url });
await client.connect();

for (const a of seedAccounts) {
  const hash = await bcrypt.hash(a.password, 10);
  await client.query(
    `INSERT INTO users (email, password_hash, name, role, organization)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       name = EXCLUDED.name,
       role = EXCLUDED.role`,
    [a.email, hash, a.name, a.role, a.org]
  );
  console.log(`seeded ${a.email} / ${a.password}`);
}

await client.end();
console.log("seed complete");
