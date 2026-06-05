import { db } from "./db";
import { profiles, userRoles, userSessions, adminSessions } from "../shared/schema";
import { eq, and, gt } from "drizzle-orm";
import { hashPassword, verifyPassword, generateToken } from "./password";

const ADMIN_EMAIL = "admin@shatakshiherbal.com";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function createOrGetProfile(email: string, fullName?: string) {
  const existing = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const [created] = await db
    .insert(profiles)
    .values({ email, fullName: fullName ?? null })
    .returning();

  await db.insert(userRoles).values({ userId: created.id, role: "user" }).onConflictDoNothing();
  return created;
}

export async function createUserSession(profileId: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db.insert(userSessions).values({ token, profileId, expiresAt });
  return token;
}

export async function getUserFromToken(token: string | null | undefined) {
  if (!token) return null;
  const now = new Date();
  const rows = await db
    .select({ profile: profiles })
    .from(userSessions)
    .innerJoin(profiles, eq(userSessions.profileId, profiles.id))
    .where(and(eq(userSessions.token, token), gt(userSessions.expiresAt, now)))
    .limit(1);
  return rows[0]?.profile ?? null;
}

export async function createAdminSession(profileId: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db.insert(adminSessions).values({ token, profileId, expiresAt });
  return token;
}

export async function getAdminFromToken(token: string | null | undefined) {
  if (!token) return null;
  const now = new Date();
  const rows = await db
    .select({ profile: profiles })
    .from(adminSessions)
    .innerJoin(profiles, eq(adminSessions.profileId, profiles.id))
    .where(and(eq(adminSessions.token, token), gt(adminSessions.expiresAt, now)))
    .limit(1);
  return rows[0]?.profile ?? null;
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const rows = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, userId));
  return rows.map((r) => r.role);
}

export async function isAdminEmail(email: string) {
  return email.toLowerCase() === ADMIN_EMAIL;
}

export { hashPassword, verifyPassword };
