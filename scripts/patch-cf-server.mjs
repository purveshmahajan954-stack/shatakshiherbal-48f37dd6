import { readFileSync, writeFileSync } from "fs";

const path = "dist/server/server.js";
const src = readFileSync(path, "utf8");

const patch = `
// CF Workers: copy secrets from env binding to process.env before handler runs
function patchEnv(env) {
  if (!env || typeof env !== "object") return;
  const keys = ["NEON_DATABASE_URL","RAZORPAY_KEY_ID","RAZORPAY_KEY_SECRET","RAZORPAY_WEBHOOK_SECRET","NODE_ENV"];
  for (const k of keys) {
    if (env[k] !== undefined && process.env[k] === undefined) {
      process.env[k] = env[k];
    }
  }
}
`;

const target = `const server = {
  async fetch(request, env, ctx) {
    try {`;

const replacement = `${patch}const server = {
  async fetch(request, env, ctx) {
    patchEnv(env);
    try {`;

if (!src.includes(target)) {
  console.error("ERROR: patch target not found in dist/server/server.js");
  console.error("Looking for:", target.slice(0, 80));
  process.exit(1);
}

if (src.includes("patchEnv(env)")) {
  console.log("Already patched, skipping.");
  process.exit(0);
}

writeFileSync(path, src.replace(target, replacement));
console.log("✓ Patched dist/server/server.js with CF env bridge.");
