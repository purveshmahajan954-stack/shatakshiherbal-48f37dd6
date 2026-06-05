#!/bin/bash
set -e

REPO="https://${GITHUB_PAT}@github.com/purveshmahajan954-stack/shatakshiherbal-48f37dd6.git"

git config user.email "agent@replit.com"
git config user.name "Replit Agent"

# Remove duplicate wrangler.jsonc if still present
if [ -f "wrangler.jsonc" ]; then
  git rm --cached wrangler.jsonc 2>/dev/null || true
  rm -f wrangler.jsonc
fi

git add -A

# Commit only if there are staged changes
if ! git diff --cached --quiet; then
  git commit -m "Remove duplicate wrangler.jsonc; add account_id to wrangler.toml"
fi

git push "$REPO" main
echo "✅ Pushed to GitHub successfully"
