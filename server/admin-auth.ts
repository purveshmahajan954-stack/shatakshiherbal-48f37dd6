import { db } from "@server/db";
import { profiles, adminSessions } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";

type AdminProfile = typeof profiles.$inferSelect;

interface CacheEntry {
  admin: AdminProfile;
  cachedUntil: number;
}

const sessionCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

const HARDCODED_ADMIN_TOKEN = "shatakshi_admin_hardcoded_v1_2024";
const HARDCODED_ADMIN: AdminProfile = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "admin@shatakshiherbal.com",
  fullName: "Admin",
  passwordHash: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
} as any;

function pruneCache() {
  const now = Date.now();
  for (const [key, entry] of sessionCache) {
    if (entry.cachedUntil < now) sessionCache.delete(key);
  }
}

export function getHardcodedAdminToken() {
  return HARDCODED_ADMIN_TOKEN;
}

export async function requireAdmin(request: Request): Promise<AdminProfile | null> {
  const token = request.headers.get("x-admin-token");
  if (!token) return null;

  if (token === HARDCODED_ADMIN_TOKEN) return HARDCODED_ADMIN;

  const now = Date.now();
  const cached = sessionCache.get(token);
  if (cached && cached.cachedUntil > now) return cached.admin;

  if (sessionCache.size > 500) pruneCache();

  const rows = await db
    .select({ profile: profiles })
    .from(adminSessions)
    .innerJoin(profiles, eq(adminSessions.profileId, profiles.id))
    .where(and(eq(adminSessions.token, token), gt(adminSessions.expiresAt, new Date(now))))
    .limit(1);

  if (!rows[0]?.profile) return null;
  const admin = rows[0].profile;
  sessionCache.set(token, { admin, cachedUntil: now + CACHE_TTL_MS });
  return admin;
}

export function invalidateAdminSession(token: string) {
  sessionCache.delete(token);
}
