import { defineConfig } from "drizzle-kit";

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

export default defineConfig({
  out: "./drizzle",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString!,
  },
});
