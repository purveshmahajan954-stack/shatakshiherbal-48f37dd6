---
name: Cloudflare Workers incompatibility
description: Why this app cannot be deployed to Cloudflare Workers and what to use instead
---

This app uses `pg` (Node.js PostgreSQL client) which requires TCP connections. Cloudflare Workers runs in V8 isolates — TCP is not supported.

Additionally, Replit's built-in PostgreSQL (DATABASE_URL) is on Replit's internal network and is not reachable from outside (Cloudflare, Vercel, etc.).

**Why:** The migration was from Supabase to Replit's built-in PostgreSQL specifically for Replit hosting. The database is intentionally internal-only.

**How to apply:** Always use Replit Deploy (`.replit.app`). If the user asks about Cloudflare / Vercel / Netlify deployment, explain that the database is not externally accessible and `pg` won't work on edge runtimes. To deploy elsewhere, they'd need to migrate the database to an external provider (Neon, Supabase, etc.) and switch to an HTTP-based PostgreSQL driver.
