import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { otpCodes, profiles, userRoles, userSessions } from "@shared/schema";
import { and, eq, gt } from "drizzle-orm";
import { hashPassword, generateToken } from "@server/password";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 13 && raw.startsWith("+91")) return digits.slice(2);
  return null;
}

async function createSession(profileId: string): Promise<{ token: string; cookieHeader: string }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db.insert(userSessions).values({ token, profileId, expiresAt });
  const cookieMaxAge = Math.floor(SESSION_DURATION_MS / 1000);
  return {
    token,
    cookieHeader: `auth_token=${token}; Path=/; Max-Age=${cookieMaxAge}; SameSite=Lax`,
  };
}

export const Route = createFileRoute("/api/auth/otp-verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          let body: any;
          try {
            body = await request.json();
          } catch {
            return Response.json({ error: "Invalid JSON" }, { status: 400 });
          }

          const { phone: rawPhone, code, context, fullName, password } = body ?? {};

          if (!rawPhone || !code) {
            return Response.json({ error: "Phone and OTP code are required" }, { status: 400 });
          }

          const phone = normalizePhone(String(rawPhone));
          if (!phone) {
            return Response.json({ error: "Invalid phone number" }, { status: 400 });
          }

          const otpStr = String(code).trim();
          if (!/^\d{6}$/.test(otpStr)) {
            return Response.json({ error: "OTP must be a 6-digit number" }, { status: 400 });
          }

          const now = new Date();
          const otpRows = await db
            .select()
            .from(otpCodes)
            .where(
              and(eq(otpCodes.phone, phone), eq(otpCodes.used, false), gt(otpCodes.expiresAt, now))
            )
            .orderBy(otpCodes.createdAt)
            .limit(1);

          if (otpRows.length === 0) {
            return Response.json(
              { error: "OTP expired or not found. Please request a new code." },
              { status: 400 }
            );
          }

          const otpRow = otpRows[0];

          if (otpRow.attempts >= MAX_ATTEMPTS) {
            await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, otpRow.id));
            return Response.json(
              { error: "Too many incorrect attempts. Please request a new OTP." },
              { status: 429 }
            );
          }

          if (otpRow.code !== otpStr) {
            await db
              .update(otpCodes)
              .set({ attempts: otpRow.attempts + 1 })
              .where(eq(otpCodes.id, otpRow.id));
            const remaining = MAX_ATTEMPTS - otpRow.attempts - 1;
            return Response.json(
              { error: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` },
              { status: 400 }
            );
          }

          await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, otpRow.id));

          if (context === "signup") {
            if (!fullName?.trim()) {
              return Response.json({ error: "Full name is required" }, { status: 400 });
            }
            if (!password || password.length < 6) {
              return Response.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
              );
            }

            const existing = await db
              .select({ id: profiles.id })
              .from(profiles)
              .where(eq(profiles.phone, phone))
              .limit(1);

            if (existing.length > 0) {
              return Response.json(
                { error: "An account with this phone number already exists. Please log in." },
                { status: 409 }
              );
            }

            const passwordHash = await hashPassword(password);
            const [profile] = await db
              .insert(profiles)
              .values({ phone, fullName: fullName.trim(), passwordHash })
              .returning();

            await db.insert(userRoles).values({ userId: profile.id, role: "user" });
            const { token, cookieHeader } = await createSession(profile.id);

            return new Response(
              JSON.stringify({
                token,
                user: { id: profile.id, email: profile.email, phone: profile.phone, fullName: profile.fullName },
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json", "Set-Cookie": cookieHeader },
              }
            );
          }

          const existing = await db
            .select()
            .from(profiles)
            .where(eq(profiles.phone, phone))
            .limit(1);

          let profile: typeof profiles.$inferSelect;
          if (existing.length > 0) {
            profile = existing[0];
          } else {
            const [created] = await db
              .insert(profiles)
              .values({ phone })
              .returning();
            await db.insert(userRoles).values({ userId: created.id, role: "user" });
            profile = created;
          }

          const { token, cookieHeader } = await createSession(profile.id);

          return new Response(
            JSON.stringify({
              token,
              user: { id: profile.id, email: profile.email, phone: profile.phone, fullName: profile.fullName },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json", "Set-Cookie": cookieHeader },
            }
          );
        } catch (err: any) {
          console.error("[otp-verify]", err);
          return Response.json({ error: err?.message ?? "Verification failed" }, { status: 500 });
        }
      },
    },
  },
});
