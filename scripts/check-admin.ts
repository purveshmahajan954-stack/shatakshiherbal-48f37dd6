import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { profiles } from "../shared/schema";
import { eq } from "drizzle-orm";

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("No DB URL");

const pool = new Pool({ connectionString });
const db = drizzle(pool);
const rows = await db.select().from(profiles).where(eq(profiles.email, "admin@shatakshiherbal.com"));
const row = rows[0] as any;
console.log("email:", row?.email);
console.log("hash:", row?.passwordHash?.slice(0, 70));
console.log("is_bcrypt:", row?.passwordHash?.startsWith("$2"));
await pool.end();
