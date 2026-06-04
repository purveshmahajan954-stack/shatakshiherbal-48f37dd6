---
name: Cloudflare Workers — DB driver setup
description: DB driver choice for Cloudflare Workers vs Replit dev environment
---

The app supports **both** Replit dev (TCP PostgreSQL) and Cloudflare Workers (Neon HTTP) through two separate connection strings:

- **Development (Replit):** Uses `DATABASE_URL` (Replit internal PostgreSQL, `pg` + `drizzle-orm/node-postgres`)
- **Production (Cloudflare Workers):** Uses `NEON_DATABASE_URL` (Neon external PostgreSQL, `@neondatabase/serverless` + `drizzle-orm/neon-http`)

**Current state:** `server/db.ts` now uses the **Neon HTTP driver** (`@neondatabase/serverless`) with `NEON_DATABASE_URL`. This is required for Cloudflare Workers (V8 isolates have no TCP support).

**Why:** The Neon HTTP driver works on both edge runtimes and Node.js. The Replit built-in PostgreSQL (`DATABASE_URL`) is only reachable from within Replit's network — not from Cloudflare.

**How to apply:** Always use `NEON_DATABASE_URL` with the Neon HTTP driver for any code that must run on CF Workers. The `drizzle.config.ts` falls back to `DATABASE_URL` if `NEON_DATABASE_URL` is absent so `db:push` still works in Replit dev. Secrets on Cloudflare must be set via `wrangler secret put` or the CF dashboard.
