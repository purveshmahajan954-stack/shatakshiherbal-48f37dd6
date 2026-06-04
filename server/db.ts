import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Make sure the PostgreSQL database is provisioned."
  );
}

const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
