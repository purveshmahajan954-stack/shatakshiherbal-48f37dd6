import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { profiles, adminSessions } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";

export const Route = createFileRoute("/api/admin/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = request.headers.get("x-admin-token");
        if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const now = new Date();
        const rows = await db
          .select({ profile: profiles })
          .from(adminSessions)
          .innerJoin(profiles, eq(adminSessions.profileId, profiles.id))
          .where(and(eq(adminSessions.token, token), gt(adminSessions.expiresAt, now)))
          .limit(1);

        if (rows.length === 0) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const profile = rows[0].profile as any;
        return Response.json({ admin: { id: profile.id, email: profile.email, fullName: profile.fullName } });
      },
    },
  },
});
