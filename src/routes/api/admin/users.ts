import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { profiles, userRoles } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAdmin } from "@server/admin-auth";

export const Route = createFileRoute("/api/admin/users")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const [allProfiles, allRoles] = await Promise.all([
          db.select({ id: profiles.id, email: profiles.email, fullName: profiles.fullName, createdAt: profiles.createdAt }).from(profiles).orderBy(desc(profiles.createdAt)),
          db.select({ userId: userRoles.userId, role: userRoles.role }).from(userRoles),
        ]);

        return Response.json({ profiles: allProfiles, roles: allRoles });
      },
      POST: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

        const { userId, role } = body ?? {};
        if (!userId || !role) return Response.json({ error: "userId and role required" }, { status: 400 });

        await db.insert(userRoles).values({ userId, role }).onConflictDoNothing();
        return Response.json({ ok: true });
      },
      DELETE: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const url = new URL(request.url);
        const userId = url.searchParams.get("userId");
        const role = url.searchParams.get("role");
        if (!userId || !role) return Response.json({ error: "userId and role required" }, { status: 400 });

        await db.delete(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.role, role as any)));
        return Response.json({ ok: true });
      },
    },
  },
});
