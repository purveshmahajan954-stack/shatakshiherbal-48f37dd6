import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { profiles, userRoles, userSessions } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import { verifyPassword, generateToken } from "@server/password";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export const Route = createFileRoute("/api/auth/signin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          let body: any;
          try { body = await request.json(); } catch {
            return Response.json({ error: "Invalid JSON" }, { status: 400 });
          }

          const { email, password } = body ?? {};
          if (!email || !password)
            return Response.json({ error: "Email and password required" }, { status: 400 });

          const rows = await db
            .select()
            .from(profiles)
            .where(eq(profiles.email, email.toLowerCase().trim()))
            .limit(1);
          if (rows.length === 0)
            return Response.json({ error: "Invalid email or password" }, { status: 401 });

          const profile = rows[0] as any;
          if (!profile.passwordHash)
            return Response.json({ error: "Invalid email or password" }, { status: 401 });

          let valid = false;
          try {
            valid = await verifyPassword(password, profile.passwordHash);
          } catch {
            return Response.json({ error: "Invalid email or password" }, { status: 401 });
          }
          if (!valid)
            return Response.json({ error: "Invalid email or password" }, { status: 401 });

          const token = generateToken();
          const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
          await db.insert(userSessions).values({ token, profileId: profile.id, expiresAt });

          const roleRows = await db
            .select({ role: userRoles.role })
            .from(userRoles)
            .where(eq(userRoles.userId, profile.id));
          const isAdmin = roleRows.some((r) => r.role === "admin");

          const cookieMaxAge = Math.floor(SESSION_DURATION_MS / 1000);
          return new Response(
            JSON.stringify({
              token,
              user: { id: profile.id, email: profile.email, fullName: profile.fullName },
              isAdmin,
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Set-Cookie": `auth_token=${token}; Path=/; Max-Age=${cookieMaxAge}; SameSite=Lax`,
              },
            },
          );
        } catch (err: any) {
          console.error("[signin]", err);
          return Response.json({ error: err?.message ?? "Signin failed" }, { status: 500 });
        }
      },
    },
  },
});
