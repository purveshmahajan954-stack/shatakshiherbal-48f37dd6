import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { orders } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hmacSha256, timingSafeEqual } from "@server/password";
import { notifyPaymentSuccess, logPaymentEvent } from "@server/notify";

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

            // Only notify if not already processed by verify.ts (avoid duplicate notifications)
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
