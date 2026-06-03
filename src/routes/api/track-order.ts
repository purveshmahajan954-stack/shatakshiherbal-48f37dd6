import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { orders } from "@shared/schema";
import { eq } from "drizzle-orm";

export const Route = createFileRoute("/api/track-order")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const trackingId = url.searchParams.get("tracking_id");
        if (!trackingId || trackingId.length > 32) {
          return Response.json({ error: "Missing tracking_id" }, { status: 400 });
        }

        const rows = await db
          .select({
            trackingId: orders.trackingId,
            trackingStatus: orders.trackingStatus,
            trackingLocation: orders.trackingLocation,
            trackingEta: orders.trackingEta,
            trackingUpdatedAt: orders.trackingUpdatedAt,
            createdAt: orders.createdAt,
            items: orders.items,
            total: orders.total,
          })
          .from(orders)
          .where(eq(orders.trackingId, trackingId))
          .limit(1);

        if (rows.length === 0) {
          return Response.json({ error: "Order not found" }, { status: 404 });
        }

        const data = rows[0];
        return Response.json({
          tracking_id: data.trackingId,
          status: data.trackingStatus ?? "Order Placed",
          location: data.trackingLocation ?? null,
          eta: data.trackingEta ?? null,
          updated_at: data.trackingUpdatedAt,
          placed_at: data.createdAt,
          items: data.items,
          total: data.total,
        });
      },
    },
  },
});
