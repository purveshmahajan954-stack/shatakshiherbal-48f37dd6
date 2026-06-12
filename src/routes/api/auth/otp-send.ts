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
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 13 && raw.startsWith("+91")) return `+91${digits.slice(2)}`;
  return null;
}

class TwilioError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }
}

function friendlyTwilioError(code: number): string {
  switch (code) {
    case 21608:
      return "This phone number hasn't been verified with our SMS provider yet. Please sign up using Google, or contact support to get your number added.";
    case 21211:
      return "Invalid phone number. Please check the number and try again.";
    case 21614:
      return "This number cannot receive SMS. Please use a different number or sign up with Google.";
    case 21610:
      return "This number has opted out of SMS. Please sign up with Google instead.";
    case 30003:
    case 30005:
      return "Your number is unreachable right now. Please try again later or sign up with Google.";
    default:
      return "Failed to send OTP. Please try again or sign up using Google.";
  }
}

async function sendViaTwilio(phone: string, otp: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) {
    throw new Error("SMS service not configured");
  }

  const formBody = new URLSearchParams({
    Body: `Your Shatakshi Herbal verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
    From: from,
    To: phone,
  });

  const credentials = btoa(`${sid}:${token}`);
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody.toString(),
    }
  );

  if (!res.ok) {
    let data: any;
    try { data = await res.json(); } catch { data = {}; }
    const code = data?.code ?? 0;
    console.error("[otp-send] Twilio error code:", code, data?.message);
    throw new TwilioError(friendlyTwilioError(code), code);
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
            await sendViaTwilio(phone, otp);
          } catch (err: any) {
            console.error("[otp-send] Twilio error:", err);
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
