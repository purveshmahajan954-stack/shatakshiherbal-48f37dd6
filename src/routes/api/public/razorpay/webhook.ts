import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { orders } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hmacSha256, timingSafeEqual } from "@server/password";
import { notifyPaymentSuccess, logPaymentEvent } from "@server/notify";
import { createCKShipShipment } from "@server/ckship";

export const Route = createFileRoute("/api/public/razorpay/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
          console.error("[Webhook] RAZORPAY_WEBHOOK_SECRET not set");
          return new Response("Server misconfigured", { status: 500 });
        }

        const signature = request.headers.get("x-razorpay-signature");
        const body = await request.text();

        if (!signature) return new Response("Missing signature", { status: 401 });

        const expected = await hmacSha256(secret, body);
        if (!timingSafeEqual(expected, signature)) {
          console.warn("[Webhook] Invalid signature, rejecting");
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: any;
        try { payload = JSON.parse(body); } catch { return new Response("Invalid JSON", { status: 400 }); }

        const event: string = payload.event;
        const paymentEntity = payload.payload?.payment?.entity;
        const orderEntity   = payload.payload?.order?.entity;
        const rzpOrderId: string | undefined = paymentEntity?.order_id ?? orderEntity?.id;
        const rzpPaymentId: string | undefined = paymentEntity?.id;

        console.log(`[Webhook] Received event="${event}" rzpOrderId=${rzpOrderId}`);

        if (!rzpOrderId) {
          await logPaymentEvent({ event, razorpayOrderId: rzpOrderId, rawPayload: payload });
          return new Response("ok", { status: 200 });
        }

        try {
          if (event === "payment.captured" || event === "order.paid") {
            // Fetch order details for notification
            const [orderRow] = await db
              .select({
                id: orders.id,
                shippingName: orders.shippingName,
                shippingPhone: orders.shippingPhone,
                shippingAddress: orders.shippingAddress,
                email: orders.email,
                total: orders.total,
                items: orders.items,
                paymentStatus: orders.paymentStatus,
              })
              .from(orders)
              .where(eq(orders.razorpayOrderId, rzpOrderId))
              .limit(1);

            await db.update(orders).set({
              paymentStatus: "paid",
              status: "confirmed",
              razorpayPaymentId: rzpPaymentId ?? null,
            }).where(eq(orders.razorpayOrderId, rzpOrderId));

            console.log(`[Webhook] ✅ Order confirmed via ${event} for rzpOrderId=${rzpOrderId}`);

            // Only notify & create shipment if not already processed by verify.ts
            if (orderRow && orderRow.paymentStatus !== "paid") {
              console.log(`[Webhook] Firing notifications for order ${orderRow.id}`);
              notifyPaymentSuccess({
                id: orderRow.id,
                razorpayOrderId: rzpOrderId,
                razorpayPaymentId: rzpPaymentId,
                shippingName: orderRow.shippingName,
                shippingPhone: orderRow.shippingPhone,
                shippingAddress: orderRow.shippingAddress,
                email: orderRow.email,
                total: orderRow.total,
                items: (orderRow.items ?? []) as Array<{ name: string; qty: number; price: number }>,
              }).catch((err) => console.error("[Webhook] notifyPaymentSuccess error:", err));

              // Auto-create CKShip shipment (only if verify.ts hasn't already done it)
              if (orderRow.shipmentStatus === "Not Created") {
                createCKShipShipment({
                  id: orderRow.id,
                  shippingName: orderRow.shippingName,
                  shippingPhone: orderRow.shippingPhone,
                  shippingAddress: orderRow.shippingAddress,
                  total: orderRow.total,
                  items: (orderRow.items ?? []) as Array<{ name: string; qty: number; price: number }>,
                }).then(async (result) => {
                  await db.update(orders).set({
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
                  }).where(eq(orders.id, orderRow.id));
                  console.log(`[Webhook] CKShip shipment created for order ${orderRow.id}, AWB: ${result.awbNumber}`);
                }).catch(async (err) => {
                  const reason = err instanceof Error ? err.message : String(err);
                  console.error(`[Webhook] Auto-CKShip failed for order ${orderRow.id}:`, reason);
                  await db.update(orders).set({
                    shipmentStatus: "Shipment Failed - Retry Needed",
                    shipmentFailedReason: reason.slice(0, 500),
                  }).where(eq(orders.id, orderRow.id));
                });
              }
            } else {
              console.log(`[Webhook] Order already paid — skipping duplicate notification`);
              await logPaymentEvent({
                orderId: orderRow?.id,
                razorpayOrderId: rzpOrderId,
                razorpayPaymentId: rzpPaymentId,
                event: `${event}.duplicate_skip`,
                amount: orderRow?.total,
              });
            }

          } else if (event === "payment.failed") {
            await db.update(orders).set({
              paymentStatus: "failed",
              status: "failed",
              razorpayPaymentId: rzpPaymentId ?? null,
            }).where(eq(orders.razorpayOrderId, rzpOrderId));

            console.log(`[Webhook] ❌ Payment failed for rzpOrderId=${rzpOrderId}`);
            await logPaymentEvent({
              razorpayOrderId: rzpOrderId,
              razorpayPaymentId: rzpPaymentId,
              event: "payment.failed",
              rawPayload: { notes: paymentEntity?.notes, error: paymentEntity?.error_code },
            });

          } else {
            console.log(`[Webhook] Unhandled event="${event}", ignoring`);
          }
        } catch (err) {
          console.error("[Webhook] DB/notify error:", err);
          return new Response("DB error", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
