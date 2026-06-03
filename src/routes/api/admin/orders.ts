import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { orders, adminSessions, profiles } from "@shared/schema";
import { eq, and, gt, desc } from "drizzle-orm";

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

export const Route = createFileRoute("/api/admin/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(1000);
        return Response.json({ orders: rows });
      },
      PATCH: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

        const allowed = ["status", "payment_status", "tracking_status", "tracking_location", "tracking_eta"];
        const patch: Record<string, any> = {};
        for (const k of allowed) {
          if (k in body) {
            if (k === "status") patch.status = body[k];
            else if (k === "payment_status") patch.paymentStatus = body[k];
            else if (k === "tracking_status") patch.trackingStatus = body[k];
            else if (k === "tracking_location") patch.trackingLocation = body[k];
            else if (k === "tracking_eta") patch.trackingEta = body[k];
          }
        }
        if (Object.keys(patch).length === 0) return Response.json({ error: "Nothing to update" }, { status: 400 });

        await db.update(orders).set({ ...patch, trackingUpdatedAt: new Date() }).where(eq(orders.id, id));
        return Response.json({ ok: true });
      },
    },
  },
});
