import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { profiles, userRoles, userSessions } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export const Route = createFileRoute("/api/auth/signin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

        const { email, password } = body ?? {};
        if (!email || !password) return Response.json({ error: "Email and password required" }, { status: 400 });

        const rows = await db.select().from(profiles).where(eq(profiles.email, email.toLowerCase().trim())).limit(1);
        if (rows.length === 0) return Response.json({ error: "Invalid email or password" }, { status: 401 });

        const profile = rows[0] as any;
        if (!profile.passwordHash) return Response.json({ error: "Invalid email or password" }, { status: 401 });

        const valid = await bcrypt.compare(password, profile.passwordHash);
        if (!valid) return Response.json({ error: "Invalid email or password" }, { status: 401 });

        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
        await db.insert(userSessions).values({ token, profileId: profile.id, expiresAt });

        const roleRows = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, profile.id));
        const isAdmin = roleRows.some((r) => r.role === "admin");

        return Response.json({
          token,
          user: { id: profile.id, email: profile.email, fullName: profile.fullName },
          isAdmin,
        });
      },
    },
  },
});
