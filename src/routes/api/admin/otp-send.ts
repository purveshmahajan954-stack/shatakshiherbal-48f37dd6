import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { otpCodes } from "@shared/schema";
import { and, eq, gt } from "drizzle-orm";

const OTP_EXPIRY_MS = 5 * 60 * 1000;

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

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendVia2Factor(phone10: string, otp: string) {
  const apiKey = process.env.TWOFACTOR_API_KEY;
  if (!apiKey) throw new Error("SMS service not configured");
  const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phone10}/${otp}/AUTOGEN`;
  const res = await fetch(url, { method: "GET" });
  const data: any = await res.json().catch(() => ({}));
  console.log("[admin/otp-send] 2Factor response:", JSON.stringify(data));
  if (data?.Status !== "Success") {
    throw new Error(data?.Details || data?.Status || `SMS error (HTTP ${res.status})`);
  }
}

export const Route = createFileRoute("/api/admin/otp-send")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          let body: any;
          try { body = await request.json(); } catch {
            return Response.json({ error: "Invalid JSON" }, { status: 400 });
          }

          const { phone: rawPhone } = body ?? {};
          if (!rawPhone) return Response.json({ error: "Phone number is required" }, { status: 400 });

          const phone = normalizePhone(String(rawPhone));
          if (!phone) {
            return Response.json({ error: "Invalid phone number. Enter a valid 10-digit number." }, { status: 400 });
          }

          const adminNumbers = getAdminNumbers();
          if (!adminNumbers.has(phone)) {
            console.warn(`[admin/otp-send] Unauthorized access attempt: ${phone}`);
            return Response.json({ error: "Access Denied. You are not authorized." }, { status: 403 });
          }

          await db
            .update(otpCodes)
            .set({ used: true })
            .where(and(eq(otpCodes.phone, `admin:${phone}`), eq(otpCodes.used, false), gt(otpCodes.expiresAt, new Date())));

          const otp = generateOtp();
          const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
          await db.insert(otpCodes).values({ phone: `admin:${phone}`, code: otp, expiresAt });

          try {
            await sendVia2Factor(phone, otp);
          } catch (err: any) {
            console.error("[admin/otp-send] 2Factor error:", err);
            return Response.json({ error: err?.message || "Failed to send OTP" }, { status: 500 });
          }

          return Response.json({ ok: true });
        } catch (err: any) {
          console.error("[admin/otp-send]", err);
          return Response.json({ error: err?.message ?? "Failed to send OTP" }, { status: 500 });
        }
      },
    },
  },
});
