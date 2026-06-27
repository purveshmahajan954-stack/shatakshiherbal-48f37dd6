#!/usr/bin/env bash
# Full Cloudflare Workers build + secret sync + deploy
set -e

echo "==> Building for Cloudflare Workers..."
npm run build:cloudflare

echo ""
echo "==> Syncing secrets to Cloudflare Workers..."

# List of secrets to push from local env to CF Workers
SECRETS=(
  NEON_DATABASE_URL
  RAZORPAY_KEY_ID
  RAZORPAY_KEY_SECRET
  RAZORPAY_WEBHOOK_SECRET
  GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET
  FIREBASE_API_KEY
  ADMIN_PHONE
  CKSHIP_AUTH_TOKEN
  TWILIO_ACCOUNT_SID
  TWILIO_AUTH_TOKEN
  TWILIO_PHONE_NUMBER
  GMAIL_USER
  GMAIL_APP_PASSWORD
  ADMIN_NOTIFY_EMAIL
  TELEGRAM_BOT_TOKEN
  TELEGRAM_CHAT_ID
)

for KEY in "${SECRETS[@]}"; do
  VAL="${!KEY}"
  if [ -n "$VAL" ]; then
    echo "$VAL" | npx wrangler secret put "$KEY" --name shatakshi-herbal
    echo "  ✓ $KEY"
  else
    echo "  ⚠ $KEY not set in environment, skipping"
  fi
done

echo ""
echo "==> Deploying to Cloudflare Workers..."
npx wrangler deploy

echo ""
echo "✅ Deployed to https://shatakshi-herbal.purveshmahajan954.workers.dev/"
