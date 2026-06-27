import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { orders, userSessions, profiles } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import { z } from "zod";
import { hmacSha256, timingSafeEqual } from "@server/password";
import { createCKShipShipment } from "@server/ckship";
import { sendSMS, smsOrderConfirmed, smsShipmentCreated, notifyPaymentSuccess } from "@server/notify";

async function requireUser(request: Request) {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  const now = new Date();
  const rows = await db
    .select({ profile: profiles })
    .from(userSessions)
    .innerJoin(profiles, eq(userSessions.profileId, profiles.id))
    .where(and(eq(userSessions.token, token), gt(userSessions.expiresAt, now)))
    .limit(1);
  return rows[0]?.profile ?? null;
}

const verifySchema = z.object({
  razorpay_order_id: z.string().min(5).max(80),
  razorpay_payment_id: z.string().min(5).max(80),
  razorpay_signature: z.string().min(10).max(256),
});

export const Route = createFileRoute("/api/payments/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await requireUser(request);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

        const parsed = verifySchema.safeParse(body);
        if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) return Response.json({ error: "Razorpay not configured" }, { status: 500 });

        const expected = await hmacSha256(secret, `${razorpay_order_id}|${razorpay_payment_id}`);
        const valid = timingSafeEqual(expected, razorpay_signature);

        if (!valid) {
          await db.update(orders).set({ paymentStatus: "signature_failed", status: "failed" })
            .where(and(eq(orders.razorpayOrderId, razorpay_order_id), eq(orders.userId, user.id)));
          return Response.json({ error: "Payment verification failed. Invalid signature." }, { status: 400 });
        }

        const [order] = await db.update(orders).set({
          paymentStatus: "paid",
          status: "confirmed",
          razorpayPaymentId: razorpay_payment_id,
        }).where(and(eq(orders.razorpayOrderId, razorpay_order_id), eq(orders.userId, user.id))).returning({
          id: orders.id,
          shippingName: orders.shippingName,
          shippingPhone: orders.shippingPhone,
          shippingAddress: orders.shippingAddress,
          email: orders.email,
          total: orders.total,
          items: orders.items,
          trackingId: orders.trackingId,
        });

        if (!order) return Response.json({ error: "Could not finalize order" }, { status: 500 });

        // Fire background tasks — order success response is not blocked by these
        (async () => {
          const name = order.shippingName ?? "Customer";
          const phone = order.shippingPhone;

          // ── Notifications: email + Telegram + DB log ──
          console.log(`[verify] Firing notifications for order ${order.id}`);
          notifyPaymentSuccess({
            id: order.id,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            shippingName: order.shippingName,
            shippingPhone: order.shippingPhone,
            shippingAddress: order.shippingAddress,
            email: order.email,
            total: order.total,
            items: (order.items ?? []) as Array<{ name: string; qty: number; price: number }>,
          }).catch((err) => console.error("[verify] notifyPaymentSuccess error:", err));

          // Send order confirmed SMS
          if (phone) {
            sendSMS(phone, smsOrderConfirmed(name, order.id, order.total)).catch(console.error);
          }

          // Auto-create CKShip shipment
          try {
            const result = await createCKShipShipment({
              id: order.id,
              shippingName: order.shippingName,
              shippingPhone: order.shippingPhone,
              shippingAddress: order.shippingAddress,
              total: order.total,
              items: (order.items ?? []) as Array<{ name: string; qty: number; price: number }>,
              paymentMethod: "prepaid",
            });

            await db.update(orders)
              .set({
                ckshipShipmentId: result.shipmentId,
                ckshipOrderNumber: result.orderNumber,
                awbNumber: result.awbNumber,
                courierName: result.courierName,
                shippingCost: result.shippingCost !== null ? String(result.shippingCost) : null,
                labelUrl: result.labelUrl,
                shipmentStatus: "Created",
                shipmentFailedReason: null,
                trackingStatus: "Packed",
                trackingUpdatedAt: new Date(),
              })
              .where(eq(orders.id, order.id));

            console.log(`[verify] CKShip shipment created for order ${order.id}, AWB: ${result.awbNumber}`);

            // Send shipment created SMS if AWB assigned
            if (phone && result.awbNumber && result.courierName) {
              sendSMS(
                phone,
                smsShipmentCreated(name, result.awbNumber, result.courierName, order.trackingId)
              ).catch(console.error);
            }
          } catch (err) {
            const reason = err instanceof Error ? err.message : String(err);
            console.error(`[verify] Auto-CKShip failed for order ${order.id}:`, reason);
            await db.update(orders)
              .set({
                shipmentStatus: "Shipment Failed - Retry Needed",
                shipmentFailedReason: reason.slice(0, 500),
              })
              .where(eq(orders.id, order.id));
          }
        })();

        return Response.json({ success: true, orderId: order.id });
      },
    },
  },
});
