import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { otpCodes, profiles, userSessions } from "@shared/schema";
import { and, eq, gt } from "drizzle-orm";
import { generateToken, hashPassword } from "@server/password";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESET_PREFIX = "reset:";

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 13 && raw.startsWith("+91")) return digits.slice(2);
  return null;
}

export const Route = createFileRoute("/api/auth/password-reset")({
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
            return Response.json({ error: "Enter a valid phone number and 6-digit OTP." }, { status: 400 });
          }
          if (password.length < 6) {
            return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 });
          }
          if (password !== confirmPassword) {
            return Response.json({ error: "Passwords do not match." }, { status: 400 });
          }

          const otpRows = await db
            .select()
            .from(otpCodes)
            .where(
              and(
                eq(otpCodes.phone, `${RESET_PREFIX}${phone}`),
                eq(otpCodes.used, false),
                gt(otpCodes.expiresAt, new Date()),
              ),
            )
            .orderBy(otpCodes.createdAt)
            .limit(1);

          const otpRow = otpRows[0];
          if (!otpRow) {
            return Response.json(
              { error: "OTP expired or not found. Please request a new code." },
              { status: 400 },
            );
          }
          if (otpRow.attempts >= MAX_ATTEMPTS) {
            await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, otpRow.id));
            return Response.json(
              { error: "Too many incorrect attempts. Please request a new OTP." },
              { status: 429 },
            );
          }
          if (otpRow.code !== code) {
            await db
              .update(otpCodes)
              .set({ attempts: otpRow.attempts + 1 })
              .where(eq(otpCodes.id, otpRow.id));
            return Response.json({ error: "Incorrect OTP. Please try again." }, { status: 400 });
          }

          const account = await db
            .select({ id: profiles.id })
            .from(profiles)
            .where(eq(profiles.phone, phone))
            .limit(1);
          if (account.length === 0) {
            await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, otpRow.id));
            return Response.json({ error: "No account found for this phone number." }, { status: 404 });
          }

          await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, otpRow.id));
          const passwordHash = await hashPassword(password);
          await db
            .update(profiles)
            .set({ passwordHash, updatedAt: new Date() })
            .where(eq(profiles.id, account[0].id));

          // Invalidate existing sessions after a password reset.
          await db.delete(userSessions).where(eq(userSessions.profileId, account[0].id));

          const token = generateToken();
          await db.insert(userSessions).values({
            token,
            profileId: account[0].id,
            expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
          });

          return new Response(
            JSON.stringify({ ok: true, token }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Set-Cookie": `auth_token=${token}; Path=/; Max-Age=${Math.floor(SESSION_DURATION_MS / 1000)}; SameSite=Lax`,
              },
            },
          );
        } catch (err: any) {
          console.error("[password-reset]", err);
          return Response.json(
            { error: err?.message ?? "Password reset failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});