import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { orders } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@server/admin-auth";
import { triggerRazorpayRefund } from "@/routes/api/orders/cancel";
import { cancelCKShipShipment } from "@server/ckship";

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
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const allowed = [
          "status",
          "payment_status",
          "tracking_status",
          "tracking_location",
          "tracking_eta",
        ];
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
        if (Object.keys(patch).length === 0)
          return Response.json({ error: "Nothing to update" }, { status: 400 });

        // Fetch order when we need it for side-effects (refund or CKShip cancel)
        let fetchedOrder: (typeof orders.$inferSelect) | null = null;
        const needsOrder = body.payment_status === "refunded" || body.status === "cancelled";
        if (needsOrder) {
          const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
          fetchedOrder = rows[0] ?? null;
        }

        // Auto-trigger Razorpay refund when admin sets payment_status → refunded
        let refundResult: { ok: boolean; refundId?: string; error?: string } | null = null;
        if (body.payment_status === "refunded" && fetchedOrder?.razorpayPaymentId) {
          if (fetchedOrder.paymentStatus !== "refunded") {
            refundResult = await triggerRazorpayRefund(fetchedOrder.razorpayPaymentId);
          }
        }

        // Auto-cancel CKShip shipment when admin sets status → cancelled and AWB exists
        let ckshipResult: { success: boolean; message: string } | null = null;
        if (body.status === "cancelled" && fetchedOrder?.awbNumber && fetchedOrder.shipmentStatus !== "Cancelled") {
          try {
            ckshipResult = await cancelCKShipShipment(fetchedOrder.awbNumber);
            if (ckshipResult.success) {
              patch.shipmentStatus = "Cancelled";
            }
          } catch (e) {
            console.warn("[admin cancel] CKShip cancel failed (non-fatal):", e);
          }
        }

        await db
          .update(orders)
          .set({ ...patch, trackingUpdatedAt: new Date() })
          .where(eq(orders.id, id));

        return Response.json({ ok: true, refund: refundResult, ckship: ckshipResult });
      },
    },
  },
});
