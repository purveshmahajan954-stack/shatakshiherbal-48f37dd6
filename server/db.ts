/**
 * Database client using Neon serverless HTTP driver.
 * Works on Cloudflare Workers, Vercel Edge, and any edge runtime
 * because it uses HTTPS (not TCP) to connect to Neon Postgres.
 *
 * SETUP:
 *   1. Create a free Neon project at https://neon.tech
 *   2. Copy your connection string (starts with postgres://...)
 *   3. Add NEON_DATABASE_URL as a secret / environment variable
 *   4. In Cloudflare dashboard → Workers → Settings → Variables, add NEON_DATABASE_URL
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@shared/schema";

const connectionString = process.env.NEON_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "NEON_DATABASE_URL is not set. " +
      "Create a free Neon project at https://neon.tech, copy your connection string, " +
      "and set it as the NEON_DATABASE_URL environment variable."
  );
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
