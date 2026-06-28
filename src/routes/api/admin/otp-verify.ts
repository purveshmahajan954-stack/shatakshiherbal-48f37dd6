import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { otpCodes, profiles, adminSessions, userRoles } from "@shared/schema";
import { and, eq, gt } from "drizzle-orm";
import { generateToken } from "@server/password";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

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

export const Route = createFileRoute("/api/admin/otp-verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          let body: any;
          try { body = await request.json(); } catch {
            return Response.json({ error: "Invalid JSON" }, { status: 400 });
          }

          const { phone: rawPhone, code } = body ?? {};
          if (!rawPhone || !code) {
            return Response.json({ error: "Phone and OTP code are required" }, { status: 400 });
          }

          const phone = normalizePhone(String(rawPhone));
          if (!phone) return Response.json({ error: "Invalid phone number" }, { status: 400 });

          const adminNumbers = getAdminNumbers();
          if (!adminNumbers.has(phone)) {
            return Response.json({ error: "Access Denied. You are not authorized." }, { status: 403 });
          }

          const otpStr = String(code).trim();
          if (!/^\d{6}$/.test(otpStr)) {
            return Response.json({ error: "OTP must be a 6-digit number" }, { status: 400 });
          }

          const now = new Date();
          const otpRows = await db
            .select()
            .from(otpCodes)
            .where(and(eq(otpCodes.phone, `admin:${phone}`), eq(otpCodes.used, false), gt(otpCodes.expiresAt, now)))
            .orderBy(otpCodes.createdAt)
            .limit(1);

          if (otpRows.length === 0) {
            return Response.json({ error: "OTP expired or not found. Please request a new code." }, { status: 400 });
          }

          const otpRow = otpRows[0];

          if (otpRow.attempts >= MAX_ATTEMPTS) {
            await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, otpRow.id));
            return Response.json({ error: "Too many attempts. Please request a new OTP." }, { status: 429 });
          }

          if (otpRow.code !== otpStr) {
            await db.update(otpCodes).set({ attempts: otpRow.attempts + 1 }).where(eq(otpCodes.id, otpRow.id));
            const remaining = MAX_ATTEMPTS - otpRow.attempts - 1;
            return Response.json({ error: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` }, { status: 400 });
          }

          await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, otpRow.id));

          const existing = await db.select().from(profiles).where(eq(profiles.phone, phone)).limit(1);
          let profile: typeof profiles.$inferSelect;
          if (existing.length > 0) {
            profile = existing[0];
          } else {
            const [created] = await db.insert(profiles).values({ phone, fullName: "Admin" }).returning();
            await db.insert(userRoles).values({ userId: created.id, role: "admin" });
            profile = created;
          }

          const roleRows = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, profile.id));
          const isAdmin = roleRows.some(r => r.role === "admin");
          if (!isAdmin) {
            await db.insert(userRoles).values({ userId: profile.id, role: "admin" }).onConflictDoNothing();
          }

          const token = generateToken();
          const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
          await db.insert(adminSessions).values({ token, profileId: profile.id, expiresAt });

          return Response.json({
            token,
            admin: { id: profile.id, phone: profile.phone, fullName: profile.fullName ?? "Admin" },
          });
        } catch (err: any) {
          console.error("[admin/otp-verify]", err);
          return Response.json({ error: err?.message ?? "Verification failed" }, { status: 500 });
        }
      },
    },
  },
});
