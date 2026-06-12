import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { orders } from "@shared/schema";
import { eq, or } from "drizzle-orm";
import { trackCKShipShipment } from "@server/ckship";

export const Route = createFileRoute("/api/track-order")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);

        /* Support multiple lookup methods: tracking_id, phone, or order short-id */
        const trackingId = url.searchParams.get("tracking_id");
        const phone = url.searchParams.get("phone");
        const orderId = url.searchParams.get("order_id");

        if (!trackingId && !phone && !orderId) {
          return Response.json({ error: "Provide tracking_id, phone, or order_id" }, { status: 400 });
        }

        let row: typeof orders.$inferSelect | null = null;

        if (trackingId) {
          if (trackingId.length > 40) return Response.json({ error: "Invalid tracking_id" }, { status: 400 });
          const rows = await db.select().from(orders).where(eq(orders.trackingId, trackingId)).limit(1);
          row = rows[0] ?? null;
        } else if (phone) {
          /* Normalize phone: strip non-digits, take last 10, prefix +91 */
          const digits = phone.replace(/\D/g, "").slice(-10);
          if (digits.length < 10) return Response.json({ error: "Invalid phone number" }, { status: 400 });
          const rows = await db
            .select()
            .from(orders)
            .where(or(eq(orders.shippingPhone, digits), eq(orders.shippingPhone, `+91${digits}`), eq(orders.shippingPhone, `91${digits}`)))
            .limit(1);
          row = rows[0] ?? null;
        } else if (orderId) {
          if (orderId.length > 64) return Response.json({ error: "Invalid order_id" }, { status: 400 });
          const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
          row = rows[0] ?? null;
        }

        if (!row) {
          return Response.json({ error: "Order not found" }, { status: 404 });
        }

        /* Live-fetch from CKShip if AWB exists and shipment was created */
        if (row.awbNumber && row.shipmentStatus !== "Cancelled") {
          try {
            const track = await trackCKShipShipment(row.awbNumber);

            /* Persist updated status + events to DB */
            await db.update(orders).set({
              trackingStatus: track.status,
              trackingLocation: track.location,
              trackingEta: track.eta,
              courierName: track.courierName ?? row.courierName,
              trackingEvents: track.events,
              trackingUpdatedAt: new Date(),
            }).where(eq(orders.id, row.id));

            /* Use fresh data for response */
            row = { ...row, trackingStatus: track.status, trackingLocation: track.location, trackingEta: track.eta, courierName: track.courierName ?? row.courierName, trackingEvents: track.events };
          } catch (err) {
            /* Non-fatal — fall back to stored data */
            console.warn("[track-order] Live CKShip fetch failed, serving stored data:", err);
          }
        }

        return Response.json({
          tracking_id: row.trackingId,
          order_id: row.id,
          status: row.trackingStatus ?? "Order Placed",
          location: row.trackingLocation ?? null,
          eta: row.trackingEta ?? null,
          updated_at: row.trackingUpdatedAt,
          placed_at: row.createdAt,
          awb_number: row.awbNumber ?? null,
          courier_name: row.courierName ?? null,
          shipment_status: row.shipmentStatus,
          events: (row.trackingEvents as any[]) ?? [],
          items: row.items,
          total: row.total,
        });
      },
    },
  },
});
