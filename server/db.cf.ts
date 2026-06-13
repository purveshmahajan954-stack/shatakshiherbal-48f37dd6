import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@shared/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _warmedUp = false;

function getDb() {
  if (_db) return _db;
  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    throw new Error("NEON_DATABASE_URL is not set.");
  }
  const sql = neon(connectionString);
  _db = drizzle(sql, { schema });

  if (!_warmedUp) {
    _warmedUp = true;
    sql`SELECT 1`.catch(() => {});
  }

  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});
