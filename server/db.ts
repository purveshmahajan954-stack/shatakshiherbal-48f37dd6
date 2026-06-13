import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

// Prefer NEON_DATABASE_URL so that admin panel changes on Replit dev
// go to the same database the live Cloudflare site reads from.
// Falls back to local Replit PostgreSQL (DATABASE_URL) if Neon is not set.

const neonUrl = process.env.NEON_DATABASE_URL;
const localUrl = process.env.DATABASE_URL;

if (!neonUrl && !localUrl) {
  throw new Error("Neither NEON_DATABASE_URL nor DATABASE_URL is set.");
}

function createDb() {
  if (neonUrl) {
    const sql = neon(neonUrl);
    return drizzleNeon(sql, { schema });
  }
  const pool = new Pool({
    connectionString: localUrl!,
    ssl: localUrl!.includes("ssl") ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 3_000,
    allowExitOnIdle: false,
  });
  return drizzlePg(pool, { schema });
}

export const db = createDb();
