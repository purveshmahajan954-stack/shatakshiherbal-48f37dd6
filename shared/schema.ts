/**
 * Drizzle ORM schema for Neon database.
 * The app primarily uses Supabase (REST API, already CF Workers compatible).
 * This schema is the foundation for any future Neon-based tables.
 * Add your table definitions here as needed.
 */
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Example table — extend or replace as needed
export const _placeholder = pgTable("_schema_placeholder", {
  id: uuid("id").primaryKey().defaultRandom(),
  created_at: timestamp("created_at").defaultNow(),
  note: text("note"),
});
