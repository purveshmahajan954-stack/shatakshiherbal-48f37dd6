import { neon } from "@neondatabase/serverless";
import pg from "pg";

const PASSWORD = "shatakshiherbal";
const EMAIL = "admin@shatakshiherbal.com";
const FULL_NAME = "Shatakshi Herbal Admin";
const ITERATIONS = 100_000;
const KEY_LENGTH = 32;

function buf2hex(buf) {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password) {
  const saltBuf = crypto.getRandomValues(new Uint8Array(16));
  const salt = buf2hex(saltBuf.buffer);
  const keyMaterial = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBuf, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial, KEY_LENGTH * 8
  );
  return `${salt}:${buf2hex(derived)}`;
}

async function upsertAdmin(queryFn, label) {
  const hash = await hashPassword(PASSWORD);

  await queryFn(`
    INSERT INTO profiles (id, email, full_name, password_hash, created_at, updated_at)
    VALUES (gen_random_uuid(), $1, $2, $3, now(), now())
    ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          full_name     = EXCLUDED.full_name,
          updated_at    = now()
  `, [EMAIL, FULL_NAME, hash]);

  await queryFn(`
    INSERT INTO user_roles (id, user_id, role, created_at)
    SELECT gen_random_uuid(), id, 'admin', now()
    FROM profiles WHERE email = $1
    ON CONFLICT (user_id, role) DO NOTHING
  `, [EMAIL]);

  console.log(`✅ [${label}] Admin upserted with new password hash`);
}

async function main() {
  const replitUrl = process.env.DATABASE_URL;
  const neonUrl   = process.env.NEON_DATABASE_URL;

  if (replitUrl) {
    const client = new pg.Client({ connectionString: replitUrl });
    await client.connect();
    const queryFn = (sql, params) => client.query(sql, params);
    await upsertAdmin(queryFn, "Replit DB");
    await client.end();
  } else {
    console.warn("⚠️  DATABASE_URL not set — skipping Replit DB");
  }

  if (neonUrl) {
    const sql = neon(neonUrl);
    const queryFn = async (query, params) => {
      await sql.query(query, params);
    };
    await upsertAdmin(queryFn, "Neon DB (CF)");
  } else {
    console.warn("⚠️  NEON_DATABASE_URL not set — skipping Neon DB");
  }

  console.log("\n🎉 Done! Admin credentials set:");
  console.log(`   Email:    ${EMAIL}`);
  console.log(`   Password: ${PASSWORD}`);
}

main().catch((e) => { console.error("❌ Error:", e.message); process.exit(1); });
