import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { otpCodes } from "@shared/schema";
import { and, eq, gt } from "drizzle-orm";

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_RATE_LIMIT = 3;
const OTP_RATE_WINDOW_MS = 10 * 60 * 1000;

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

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

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 13 && raw.startsWith("+91")) return digits.slice(2);
  return null;
}

async function sendVia2Factor(phone10: string, otp: string) {
  const apiKey = process.env.TWOFACTOR_API_KEY;
  if (!apiKey) {
    throw new Error("SMS service not configured");
  }

  const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phone10}/${otp}/AUTOGEN`;

  const res = await fetch(url, { method: "GET" });

  const data: any = await res.json().catch(() => ({}));
  console.log("[otp-send] 2Factor response:", JSON.stringify(data));

  if (data?.Status !== "Success") {
    const msg = data?.Details || data?.Status || `2Factor error (HTTP ${res.status})`;
    throw new Error(msg);
  }
}

export const Route = createFileRoute("/api/auth/otp-send")({
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

          const { phone: rawPhone } = body ?? {};
          if (!rawPhone) {
            return Response.json({ error: "Phone number is required" }, { status: 400 });
          }

          const phone = normalizePhone(String(rawPhone));
          if (!phone) {
            return Response.json(
              { error: "Invalid phone number. Enter a valid 10-digit Indian mobile number." },
              { status: 400 }
            );
          }

          if (!checkRateLimit(phone)) {
            return Response.json(
              { error: "Too many OTP requests. Please wait 10 minutes before trying again." },
              { status: 429 }
            );
          }

          await db
            .update(otpCodes)
            .set({ used: true })
            .where(
              and(
                eq(otpCodes.phone, phone),
                eq(otpCodes.used, false),
                gt(otpCodes.expiresAt, new Date())
              )
            );

          const otp = generateOtp();
          const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
          await db.insert(otpCodes).values({ phone, code: otp, expiresAt });

          try {
            await sendVia2Factor(phone, otp);
          } catch (err: any) {
            console.error("[otp-send] 2Factor error:", err);
            return Response.json(
              { error: err?.message || "Failed to send OTP. Please check the phone number and try again." },
              { status: 500 }
            );
          }

          return Response.json({ ok: true, phone });
        } catch (err: any) {
          console.error("[otp-send]", err);
          const detail = err?.cause?.message || err?.message || "Failed to send OTP";
          return Response.json({ error: detail }, { status: 500 });
        }
      },
    },
  },
});
