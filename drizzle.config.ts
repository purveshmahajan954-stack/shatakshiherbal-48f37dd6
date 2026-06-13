import { defineConfig } from "drizzle-kit";

const url = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL;

if (!url) throw new Error("Neither NEON_DATABASE_URL nor DATABASE_URL is set.");

export default defineConfig({
  out: "./drizzle",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url },
});
