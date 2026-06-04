import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { orders } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@server/admin-auth";

export const Route = createFileRoute("/api/admin/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(500);
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
