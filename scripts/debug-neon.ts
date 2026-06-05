import { Pool } from "pg";
const url = process.env.NEON_DATABASE_URL;
console.log("NEON_DATABASE_URL set:", !!url);
const pool = new Pool({ connectionString: url });
const res = await pool.query(`SELECT email, password_hash FROM profiles LIMIT 3`);
console.log("profiles count from direct query:", res.rows.length);
res.rows.forEach(r => console.log(" -", r.email, "| hash:", r.password_hash?.slice(0,40)));
await pool.end();
