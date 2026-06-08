import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { profiles, userSessions } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import { hashPassword } from "@server/password";

async function requireUser(request: Request) {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  const rows = await db
    .select({ profile: profiles })
    .from(userSessions)
    .innerJoin(profiles, eq(userSessions.profileId, profiles.id))
    .where(and(eq(userSessions.token, token), gt(userSessions.expiresAt, new Date())))
    .limit(1);
  return rows[0]?.profile ?? null;
}

export const Route = createFileRoute("/api/user/profile")({
  server: {
    handlers: {
      PATCH: async ({ request }) => {
        try {
          const user = await requireUser(request);
          if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

          const body = await request.json() as any;
          const { fullName, email, password, address } = body ?? {};

          const updates: Record<string, any> = { updatedAt: new Date() };

          if (fullName !== undefined) {
            updates.fullName = String(fullName).trim().slice(0, 100) || null;
          }

          if (address !== undefined) {
            updates.address = String(address).trim().slice(0, 500) || null;
          }

          if (email !== undefined) {
            const trimmed = String(email).trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
              return Response.json({ error: "Invalid email address" }, { status: 400 });
            }
            // Check uniqueness
            const existing = await db
              .select({ id: profiles.id })
              .from(profiles)
              .where(eq(profiles.email, trimmed))
              .limit(1);
            if (existing.length > 0 && existing[0].id !== user.id) {
              return Response.json({ error: "Email already in use by another account" }, { status: 409 });
            }
            updates.email = trimmed;
          }

          if (password !== undefined) {
            const pw = String(password);
            if (pw.length < 6) {
              return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
            }
            updates.passwordHash = await hashPassword(pw);
          }

          await db.update(profiles).set(updates).where(eq(profiles.id, user.id));

          return Response.json({ ok: true });
        } catch (err: any) {
          console.error("[profile PATCH]", err);
          return Response.json({ error: "Failed to update profile" }, { status: 500 });
        }
      },
    },
  },
});
