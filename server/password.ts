const DEFAULT_ITERATIONS = 10_000;
const LEGACY_ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const ALGORITHM = "SHA-256";

function buf2hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hex2buf(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return arr;
}

async function pbkdf2(password: string, saltBuf: Uint8Array, iterations: number): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBuf, iterations, hash: ALGORITHM },
    keyMaterial,
    KEY_LENGTH * 8
  );
  return buf2hex(derived);
}

export async function hashPassword(password: string): Promise<string> {
  const saltBuf = crypto.getRandomValues(new Uint8Array(16));
  const salt = buf2hex(saltBuf.buffer);
  const derivedHex = await pbkdf2(password, saltBuf, DEFAULT_ITERATIONS);
  return `v2:${DEFAULT_ITERATIONS}:${salt}:${derivedHex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) return false;

  if (stored.startsWith("$2")) {
    throw new Error("bcrypt hash detected — re-hash required");
  }

  let iterations: number;
  let salt: string;
  let expectedHex: string;

  if (stored.startsWith("v2:")) {
    const parts = stored.split(":");
    if (parts.length !== 4) return false;
    iterations = parseInt(parts[1], 10);
    salt = parts[2];
    expectedHex = parts[3];
    if (!iterations || !salt || !expectedHex) return false;
  } else {
    const parts = stored.split(":");
    if (parts.length !== 2) return false;
    [salt, expectedHex] = parts;
    if (!salt || !expectedHex) return false;
    iterations = LEGACY_ITERATIONS;
  }

  const saltBuf = hex2buf(salt);
  const derivedHex = await pbkdf2(password, saltBuf, iterations);

  if (derivedHex.length !== expectedHex.length) return false;
  let diff = 0;
  for (let i = 0; i < derivedHex.length; i++) {
    diff |= derivedHex.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  }
  return diff === 0;
}

export function isLegacyHash(stored: string): boolean {
  return !!stored && !stored.startsWith("v2:") && !stored.startsWith("$2");
}

export function generateToken(): string {
  const buf = crypto.getRandomValues(new Uint8Array(32));
  return buf2hex(buf.buffer);
}

export function randomHex(bytes: number): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return buf2hex(buf.buffer);
}

export async function hmacSha256(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return buf2hex(sig);
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
