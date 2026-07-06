# Shatakshi Herbal

Ayurvedic e-commerce storefront built with TanStack Start (React + TanStack Router), Drizzle ORM, and Razorpay payments. Includes a separate shipping management panel.

## Architecture

- **Main app** (`npm run dev` → port 5000): TanStack Start SSR app — storefront, admin panel, auth, checkout
- **Shipping panel** (`cd shipping && node server.js` → port 3001): Standalone Express server for shipment tracking via CKShip

## Stack

- **Framework**: TanStack Start + TanStack Router (file-based routing under `src/routes/`)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: Drizzle ORM — uses `NEON_DATABASE_URL` if set, otherwise falls back to Replit's built-in `DATABASE_URL`
- **Payments**: Razorpay
- **Auth**: Session-based (admins) + Google OAuth (customers)
- **Notifications**: Telegram, WhatsApp (CallMeBot / Twilio), Gmail SMTP

## First-time setup

```bash
npm install
cd shipping && npm install && cd ..
npm run db:push      # create/migrate tables in the connected database
```

Then start both workflows: **Start application** and **Shipping Panel**.

## Required environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes (auto-set) | Replit built-in PostgreSQL |
| `NEON_DATABASE_URL` | Optional | Override with Neon DB (used by Cloudflare deployment) |
| `SESSION_SECRET` | Yes | Express session signing |
| `RAZORPAY_KEY_ID` | Payments | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | Payments | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | Payments | Razorpay webhook verification |
| `GOOGLE_CLIENT_ID` | Auth | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Auth | Google OAuth secret |
| `CKSHIP_AUTH_TOKEN` | Shipping | CKShip API token for shipping panel |
| `FIREBASE_API_KEY` | Notifications | Firebase push notifications |
| `TELEGRAM_BOT_TOKEN` | Notifications | Order alerts via Telegram |
| `TELEGRAM_CHAT_ID` | Notifications | Telegram chat to send alerts to |
| `GMAIL_USER` | Notifications | Gmail address for order emails |
| `GMAIL_APP_PASSWORD` | Notifications | Gmail app password |
| `IMGBB_API_KEY` | Admin | Image uploads for products |

## Database

Schema lives in `shared/schema.ts`. To apply changes:

```bash
npm run db:push     # push schema to connected DB
npm run db:studio   # open Drizzle Studio GUI
```

## Cloudflare deployment

```bash
npm run deploy:cloudflare   # builds for CF Workers + deploys via Wrangler
```

Cloudflare secrets must be set via `wrangler secret put <KEY>` — they are not read from `process.env` in the CF Workers build.

## Replit setup status

- ✅ `npm install` — root dependencies installed (640 packages)
- ✅ `cd shipping && npm install` — shipping panel dependencies installed (67 packages)
- ✅ `npm run db:push` — schema pushed to Replit's built-in PostgreSQL (`DATABASE_URL`); all tables created
- ✅ Both workflows running: **Start application** (port 5000) and **Shipping Panel** (port 3001)
- ⚠️ No product/admin data seeded yet — storefront is live but empty
- ⚠️ Optional secrets (Razorpay, Google OAuth, Telegram, etc.) not yet configured

## User preferences

- Keep existing project structure and stack — do not restructure without asking
