import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { otpCodes, profiles, adminSessions, userRoles } from "@shared/schema";
import { and, eq, gt } from "drizzle-orm";
import { hashPassword, generateToken } from "@server/password";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESET_PREFIX = "admin-reset:";

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 13 && raw.startsWith("+91")) return digits.slice(2);
  return null;
}

function getAdminNumbers(): Set<string> {
  const raw = process.env.ADMIN_NUMBERS ?? "";
  const nums = raw.split(",").map(n => n.trim().replace(/\D/g, "").slice(-10)).filter(n => n.length === 10);
  return new Set(nums);
}

export const Route = createFileRoute("/api/admin/password-reset")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => null);
          const phone = normalizePhone(String(body?.phone ?? ""));
          const code = String(body?.code ?? "").trim();
          const password = String(body?.password ?? "");
          const confirmPassword = String(body?.confirmPassword ?? "");

          if (!phone || !/^\d{6}$/.test(code)) {
            return Response.json({ error: "Valid phone and 6-digit OTP are required." }, { status: 400 });
          }
          if (password.length < 6) {
            return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 });
          }
          if (password !== confirmPassword) {
            return Response.json({ error: "Passwords do not match." }, { status: 400 });
          }

          const adminNumbers = getAdminNumbers();
          if (!adminNumbers.has(phone)) {
            return Response.json({ error: "Access Denied." }, { status: 403 });
          }

          const otpRows = await db.select().from(otpCodes).where(
            and(eq(otpCodes.phone, `${RESET_PREFIX}${phone}`), eq(otpCodes.used, false), gt(otpCodes.expiresAt, new Date()))
          ).orderBy(otpCodes.createdAt).limit(1);

          const otpRow = otpRows[0];
          if (!otpRow) {
            return Response.json({ error: "OTP expired or not found. Please request a new code." }, { status: 400 });
          }
          if (otpRow.attempts >= MAX_ATTEMPTS) {
            await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, otpRow.id));
            return Response.json({ error: "Too many incorrect attempts. Request a new OTP." }, { status: 429 });
          }
          if (otpRow.code !== code) {
            await db.update(otpCodes).set({ attempts: otpRow.attempts + 1 }).where(eq(otpCodes.id, otpRow.id));
            const remaining = MAX_ATTEMPTS - otpRow.attempts - 1;
            return Response.json({ error: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` }, { status: 400 });
          }

          await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, otpRow.id));

          const passwordHash = await hashPassword(password);

          // Find or create admin profile by phone
          const existing = await db.select().from(profiles).where(eq(profiles.phone, phone)).limit(1);
          let profileId: string;
          if (existing.length > 0) {
            profileId = existing[0].id;
            await db.update(profiles).set({ passwordHash, updatedAt: new Date() }).where(eq(profiles.id, profileId));
          } else {
            const [created] = await db.insert(profiles).values({ phone, fullName: "Admin", passwordHash }).returning();
            profileId = created.id;
            await db.insert(userRoles).values({ userId: profileId, role: "admin" });
          }

          // Ensure admin role
          const roleRows = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, profileId));
          if (!roleRows.some(r => r.role === "admin")) {
            await db.insert(userRoles).values({ userId: profileId, role: "admin" }).onConflictDoNothing();
          }

          // Create admin session
          const token = generateToken();
          await db.insert(adminSessions).values({ token, profileId, expiresAt: new Date(Date.now() + SESSION_DURATION_MS) });

          return Response.json({ ok: true, token, admin: { id: profileId, phone, fullName: "Admin" } });
        } catch (err: any) {
          console.error("[admin/password-reset]", err);
          return Response.json({ error: err?.message ?? "Password reset failed" }, { status: 500 });
        }
      },
    },
  },
});
