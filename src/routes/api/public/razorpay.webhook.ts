import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import crypto from "node:crypto";

/**
 * Razorpay webhook endpoint.
 *
 * Configure in Razorpay Dashboard → Settings → Webhooks:
 *   URL:     https://<your-app>.lovable.app/api/public/razorpay/webhook
 *   Secret:  RAZORPAY_WEBHOOK_SECRET (must match the env var)
 *   Events:  payment.captured, payment.failed, order.paid
 */
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

        const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expected);
        if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: any;
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const event: string = payload.event;
        const paymentEntity = payload.payload?.payment?.entity;
        const orderEntity = payload.payload?.order?.entity;
        const rzpOrderId: string | undefined = paymentEntity?.order_id ?? orderEntity?.id;
        const rzpPaymentId: string | undefined = paymentEntity?.id;

        if (!rzpOrderId) return new Response("ok", { status: 200 });

        try {
          if (event === "payment.captured" || event === "order.paid") {
            await supabaseAdmin
              .from("orders")
              .update({
                payment_status: "paid",
                status: "confirmed",
                razorpay_payment_id: rzpPaymentId ?? null,
              })
              .eq("razorpay_order_id", rzpOrderId)
              .neq("payment_status", "paid");
          } else if (event === "payment.failed") {
            await supabaseAdmin
              .from("orders")
              .update({
                payment_status: "failed",
                status: "failed",
                razorpay_payment_id: rzpPaymentId ?? null,
              })
              .eq("razorpay_order_id", rzpOrderId)
              .neq("payment_status", "paid");
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
