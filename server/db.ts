import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. The Replit PostgreSQL database should provide this automatically."
  );
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("ssl") ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
