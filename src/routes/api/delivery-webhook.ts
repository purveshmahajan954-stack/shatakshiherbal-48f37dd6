import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { orders } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sendSMS, smsOutForDelivery, smsDelivered } from "@server/notify";

function verifyWebhookSignature(body: string, signature: string | null): boolean {
  const secret = process.env.DELIVERY_WEBHOOK_SECRET;
  if (!secret) return true; // no secret configured → accept all
  if (!signature) return false;
  // Simple bearer-token check; CKShip may send token in header
  return signature === secret || signature === `Bearer ${secret}`;
}

function normalizeStatus(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes("out") && s.includes("deliver")) return "Out for Delivery";
  if (s.includes("deliver")) return "Delivered";
  if (s.includes("transit") || s.includes("in-transit")) return "In Transit";
  if (s.includes("ship") || s.includes("dispatch")) return "Shipped";
  if (s.includes("pack")) return "Packed";
  if (s.includes("rto") || s.includes("return")) return "Returned";
  if (s.includes("cancel")) return "Cancelled";
  return raw;
}

export const Route = createFileRoute("/api/delivery-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const sig = request.headers.get("x-ckship-signature") ||
          request.headers.get("x-webhook-secret") ||
          request.headers.get("authorization");

        let body: string;
        try { body = await request.text(); } catch {
          return Response.json({ error: "Could not read body" }, { status: 400 });
        }

        if (!verifyWebhookSignature(body, sig)) {
          console.warn("[delivery-webhook] Invalid signature:", sig?.slice(0, 20));
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        let payload: any;
        try { payload = JSON.parse(body); } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        console.log("[delivery-webhook] Payload:", JSON.stringify(payload).slice(0, 500));

        // CKShip may wrap in data or send flat
        const d = payload?.data ?? payload;
        const awb: string | undefined = d?.awb_number ?? d?.awb ?? d?.tracking_number;
        const rawStatus: string | undefined = d?.status ?? d?.current_status;
        const location: string | null = d?.location ?? d?.current_location ?? null;
        const eta: string | null = d?.expected_delivery ?? d?.eta ?? null;
        const courierName: string | null = d?.courier_name ?? d?.courier ?? null;

        if (!awb || !rawStatus) {
          console.log("[delivery-webhook] Missing awb or status, ignoring");
          return Response.json({ ok: true, note: "No awb or status, ignored" });
        }

        const status = normalizeStatus(rawStatus);
        console.log(`[delivery-webhook] AWB=${awb} status=${status}`);

        // Find the order by AWB
        const [order] = await db
          .select({
            id: orders.id,
            shippingName: orders.shippingName,
            shippingPhone: orders.shippingPhone,
            trackingId: orders.trackingId,
            trackingStatus: orders.trackingStatus,
          })
          .from(orders)
          .where(eq(orders.awbNumber, awb))
          .limit(1);

        if (!order) {
          console.log("[delivery-webhook] No order found for AWB:", awb);
          return Response.json({ ok: true, note: "Order not found" });
        }

        const prevStatus = order.trackingStatus;

        await db
          .update(orders)
          .set({
            trackingStatus: status,
            trackingLocation: location,
            trackingEta: eta,
            courierName: courierName ?? undefined,
            shipmentStatus: "Tracking Updated",
            trackingUpdatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));

        // Send SMS notifications on key status changes
        const phone = order.shippingPhone;
        const name = order.shippingName ?? "Customer";

        if (phone && prevStatus !== status) {
          if (status === "Out for Delivery") {
            sendSMS(phone, smsOutForDelivery(name, awb)).catch(console.error);
          } else if (status === "Delivered") {
            sendSMS(phone, smsDelivered(name)).catch(console.error);
          }
        }

        return Response.json({ ok: true, orderId: order.id, status });
      },
    },
  },
});
