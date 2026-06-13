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
          console.error("RAZORPAY_WEBHOOK_SECRET not set");
          return new Response("Server misconfigured", { status: 500 });
        }

        const signature = request.headers.get("x-razorpay-signature");
        const body = await request.text();

        if (!signature) return new Response("Missing signature", { status: 401 });

        const expected = await hmacSha256(secret, body);
        if (!timingSafeEqual(expected, signature)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: any;
        try { payload = JSON.parse(body); } catch { return new Response("Invalid JSON", { status: 400 }); }

        const event: string = payload.event;
        const paymentEntity = payload.payload?.payment?.entity;
        const orderEntity = payload.payload?.order?.entity;
        const rzpOrderId: string | undefined = paymentEntity?.order_id ?? orderEntity?.id;
        const rzpPaymentId: string | undefined = paymentEntity?.id;

        if (!rzpOrderId) return new Response("ok", { status: 200 });

        try {
          if (event === "payment.captured" || event === "order.paid") {
            await db.update(orders).set({
              paymentStatus: "paid",
              status: "confirmed",
              razorpayPaymentId: rzpPaymentId ?? null,
            }).where(eq(orders.razorpayOrderId, rzpOrderId));
          } else if (event === "payment.failed") {
            await db.update(orders).set({
              paymentStatus: "failed",
              status: "failed",
              razorpayPaymentId: rzpPaymentId ?? null,
            }).where(eq(orders.razorpayOrderId, rzpOrderId));
          }
        } catch (err) {
          console.error("Webhook DB update failed:", err);
          return new Response("DB error", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
