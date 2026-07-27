import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { otpCodes, profiles } from "@shared/schema";
import { and, eq, gt } from "drizzle-orm";

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_RATE_LIMIT = 3;
const OTP_RATE_WINDOW_MS = 10 * 60 * 1000;
const RESET_PREFIX = "reset:";
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 13 && raw.startsWith("+91")) return digits.slice(2);
  return null;
}

function generateOtp(): string {
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  return String(100000 + (random[0] % 900000));
}

function checkRateLimit(phone: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(phone);
  if (!entry || now - entry.windowStart > OTP_RATE_WINDOW_MS) {
    rateLimitMap.set(phone, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= OTP_RATE_LIMIT) return false;
  entry.count++;
  return true;
}

async function sendVia2Factor(phone: string, otp: string) {
  const apiKey = process.env.TWOFACTOR_API_KEY;
  if (!apiKey) throw new Error("SMS service not configured");

  const res = await fetch(`https://2factor.in/API/V1/${apiKey}/SMS/${phone}/${otp}/AUTOGEN`);
  const data: any = await res.json().catch(() => ({}));
  if (data?.Status !== "Success") {
    throw new Error(data?.Details || data?.Status || `SMS error (HTTP ${res.status})`);
  }
}

export const Route = createFileRoute("/api/auth/password-reset-send")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => null);
          const phone = normalizePhone(String(body?.phone ?? ""));
          if (!phone) {
            return Response.json(
              { error: "Invalid phone number. Enter a valid 10-digit Indian mobile number." },
              { status: 400 },
            );
          }

          if (!checkRateLimit(phone)) {
            return Response.json(
              { error: "Too many OTP requests. Please wait 10 minutes before trying again." },
              { status: 429 },
            );
          }

          const account = await db
            .select({ id: profiles.id })
            .from(profiles)
            .where(eq(profiles.phone, phone))
            .limit(1);

          // Keep the response generic for unknown numbers, but do not send
          // an OTP to a phone number that has no customer account.
          if (account.length === 0) {
            return Response.json({
              ok: true,
              message: "If an account exists for this number, an OTP has been sent.",
            });
          }

          const otpPhone = `${RESET_PREFIX}${phone}`;
          await db
            .update(otpCodes)
            .set({ used: true })
            .where(
              and(
                eq(otpCodes.phone, otpPhone),
                eq(otpCodes.used, false),
                gt(otpCodes.expiresAt, new Date()),
              ),
            );

          const otp = generateOtp();
          await db.insert(otpCodes).values({
            phone: otpPhone,
            code: otp,
            expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
          });

          await sendVia2Factor(phone, otp);

          return Response.json({
            ok: true,
            message: "If an account exists for this number, an OTP has been sent.",
          });
        } catch (err: any) {
          console.error("[password-reset-send]", err);
          return Response.json(
            { error: err?.message ?? "Failed to send reset OTP" },
            { status: 500 },
          );
        }
      },
    },
  },
});