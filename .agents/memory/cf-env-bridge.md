---
name: CF Workers env secrets bridge
description: CF Workers passes secrets via fetch(request, env) binding — not process.env. Patch needed post-build.
---

# Rule
After `npm run build:cloudflare`, run `node scripts/patch-cf-server.mjs` to inject a `patchEnv(env)` call into `dist/server/server.js` that copies CF env secrets to `process.env` before handlers run.

**Why:** TanStack Start uses `process.env` everywhere for secrets. CF Workers doesn't populate `process.env` from secrets — it passes them as the `env` argument to `fetch(request, env, ctx)`. Without the patch, every DB call throws "NEON_DATABASE_URL is not set".

**How to apply:** The patch is already wired into `npm run build:cloudflare` in `package.json`. If the build output structure changes (server.js fetch handler signature changes), update `scripts/patch-cf-server.mjs` to match the new target string.

Secrets patched: `NEON_DATABASE_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NODE_ENV`.
