---
name: Web Crypto password hashing
description: bcryptjs was replaced with Web Crypto PBKDF2 (server/password.ts). Seeding both DBs after this change is critical.
---

# Rule
All password hashing uses `server/password.ts` which implements PBKDF2 via the global `crypto.subtle` API (works in CF Workers, Node.js 20+, browsers). No `node:crypto` or `bcryptjs` anywhere.

Hash format: `<hex-salt>:<hex-derived-key>` (32-byte salt, 32-byte key, 100k iterations, SHA-256).

**Why:** `bcryptjs` imports `node:crypto` which CF Workers doesn't support even with `nodejs_compat`. Web Crypto API is available natively in CF Workers.

**How to apply:**
- When adding any new auth route, import from `@server/password`, never from bcryptjs or node:crypto.
- After changing the hash format or replacing bcryptjs, BOTH databases (Replit `DATABASE_URL` and Neon `NEON_DATABASE_URL`) must be re-seeded: run `npx tsx scripts/seed.ts` with each env set.
- The seed script uses `DATABASE_URL || NEON_DATABASE_URL` — to target Neon specifically, set `DATABASE_URL=$NEON_DATABASE_URL`.
- Old bcrypt hashes (`$2b$...`) in the DB will cause login failures — the verifier throws on bcrypt format, not silently fails.
