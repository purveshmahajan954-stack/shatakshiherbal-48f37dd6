import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { contactMessages, adminSessions, profiles, userRoles } from "@shared/schema";
import { eq, and, gt, desc, inArray } from "drizzle-orm";

async function requireAdmin(request: Request) {
  const token = request.headers.get("x-admin-token");
  if (!token) return null;
  const now = new Date();
  const rows = await db
    .select({ profile: profiles })
    .from(adminSessions)
    .innerJoin(profiles, eq(adminSessions.profileId, profiles.id))
    .where(and(eq(adminSessions.token, token), gt(adminSessions.expiresAt, now)))
    .limit(1);
  return rows[0]?.profile ?? null;
}

export const Route = createFileRoute("/api/admin/leads")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const [leads, adminRoles] = await Promise.all([
          db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(500),
          db.select({ userId: userRoles.userId }).from(userRoles).where(inArray(userRoles.role, ["admin", "manager"])),
        ]);

        const adminIds = [...new Set(adminRoles.map((r) => r.userId))];
        let adminProfiles: any[] = [];
        if (adminIds.length > 0) {
          adminProfiles = await db.select({ id: profiles.id, fullName: profiles.fullName, email: profiles.email }).from(profiles).where(inArray(profiles.id, adminIds));
        }

        return Response.json({ leads, admins: adminProfiles });
      },
      PATCH: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

        const patch: Record<string, any> = {};
        if ("status" in body) patch.status = body.status;
        if ("notes" in body) patch.notes = body.notes;
        if ("assigned_to" in body) patch.assignedTo = body.assigned_to;

        if (Object.keys(patch).length === 0) return Response.json({ error: "Nothing to update" }, { status: 400 });
        await db.update(contactMessages).set(patch).where(eq(contactMessages.id, id));
        return Response.json({ ok: true });
      },
      DELETE: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

        await db.delete(contactMessages).where(eq(contactMessages.id, id));
        return Response.json({ ok: true });
      },
    },
  },
});
