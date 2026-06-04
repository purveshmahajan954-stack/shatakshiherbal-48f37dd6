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
