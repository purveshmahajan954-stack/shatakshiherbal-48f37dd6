import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "../shared/schema";

const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// Direct SQL to get the hash
const res = await pool.query(`SELECT email, password_hash FROM profiles WHERE email = 'admin@shatakshiherbal.com'`);
console.log("row count:", res.rows.length);
if (res.rows[0]) {
  const h = res.rows[0].password_hash;
  console.log("hash (first 80):", h?.slice(0, 80));
  console.log("is_bcrypt:", h?.startsWith("$2"));
  console.log("has_colon:", h?.includes(":"));
}

await pool.end();
