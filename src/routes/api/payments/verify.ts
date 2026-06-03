import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { orders, userSessions, profiles } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import { z } from "zod";
import crypto from "node:crypto";

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

        const expected = crypto.createHmac("sha256", secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
        const valid = expected.length === razorpay_signature.length &&
          crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));

        if (!valid) {
          await db.update(orders).set({ paymentStatus: "signature_failed", status: "failed" })
            .where(and(eq(orders.razorpayOrderId, razorpay_order_id), eq(orders.userId, user.id)));
          return Response.json({ error: "Payment verification failed. Invalid signature." }, { status: 400 });
        }

        const [order] = await db.update(orders).set({
          paymentStatus: "paid",
          status: "confirmed",
          razorpayPaymentId: razorpay_payment_id,
        }).where(and(eq(orders.razorpayOrderId, razorpay_order_id), eq(orders.userId, user.id))).returning({ id: orders.id });

        if (!order) return Response.json({ error: "Could not finalize order" }, { status: 500 });
        return Response.json({ success: true, orderId: order.id });
      },
    },
  },
});
