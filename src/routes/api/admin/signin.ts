import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { profiles, adminSessions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, generateToken } from "@server/password";
import { getHardcodedAdminToken } from "@server/admin-auth";

const ADMIN_EMAIL = "admin@shatakshiherbal.com";
const HARDCODED_USERNAME = "admin";
const HARDCODED_PASSWORD = "shatakshiherbal";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export const Route = createFileRoute("/api/admin/signin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

        const { email, password } = body ?? {};
        if (!email || !password) return Response.json({ error: "Email and password required" }, { status: 400 });

        const normalizedEmail = email.toLowerCase().trim();

        if (
          (normalizedEmail === HARDCODED_USERNAME || normalizedEmail === ADMIN_EMAIL) &&
          password === HARDCODED_PASSWORD
        ) {
          return Response.json({
            token: getHardcodedAdminToken(),
            admin: { id: "00000000-0000-0000-0000-000000000001", email: ADMIN_EMAIL, fullName: "Admin" },
          });
        }

        if (normalizedEmail !== ADMIN_EMAIL) return Response.json({ error: "This account is not authorized." }, { status: 403 });

        const rows = await db.select().from(profiles).where(eq(profiles.email, normalizedEmail)).limit(1);
        if (rows.length === 0) return Response.json({ error: "Invalid email or password" }, { status: 401 });

        const profile = rows[0] as any;
        if (!profile.passwordHash) return Response.json({ error: "Invalid email or password" }, { status: 401 });

        let valid = false;
        try {
          valid = await verifyPassword(password, profile.passwordHash);
        } catch {
          return Response.json({ error: "Invalid email or password" }, { status: 401 });
        }
        if (!valid) return Response.json({ error: "Invalid email or password" }, { status: 401 });

        const token = generateToken();
        const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
        await db.insert(adminSessions).values({ token, profileId: profile.id, expiresAt });

        return Response.json({
          token,
          admin: { id: profile.id, email: profile.email, fullName: profile.fullName },
        });
      },
    },
  },
});
