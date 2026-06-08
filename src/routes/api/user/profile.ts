import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { profiles, userSessions } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";

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
          const { fullName } = body ?? {};

          if (fullName !== undefined) {
            const trimmed = String(fullName).trim().slice(0, 100);
            await db
              .update(profiles)
              .set({ fullName: trimmed || null, updatedAt: new Date() })
              .where(eq(profiles.id, user.id));
          }

          return Response.json({ ok: true });
        } catch (err: any) {
          console.error("[profile PATCH]", err);
          return Response.json({ error: "Failed to update profile" }, { status: 500 });
        }
      },
    },
  },
});
