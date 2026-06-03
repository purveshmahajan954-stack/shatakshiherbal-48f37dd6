import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { profiles, userRoles, userSessions } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export const Route = createFileRoute("/api/auth/signup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

        const { email, password, fullName } = body ?? {};
        if (!email || !password) return Response.json({ error: "Email and password required" }, { status: 400 });
        if (password.length < 6) return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });

        const existing = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.email, email.toLowerCase().trim())).limit(1);
        if (existing.length > 0) return Response.json({ error: "An account with this email already exists" }, { status: 409 });

        const passwordHash = await bcrypt.hash(password, 12);
        const [profile] = await db.insert(profiles).values({
          email: email.toLowerCase().trim(),
          fullName: fullName?.trim() ?? null,
          passwordHash,
        } as any).returning();

        await db.insert(userRoles).values({ userId: profile.id, role: "user" });

        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
        await db.insert(userSessions).values({ token, profileId: profile.id, expiresAt });

        return Response.json({
          token,
          user: { id: profile.id, email: profile.email, fullName: profile.fullName },
        });
      },
    },
  },
});
