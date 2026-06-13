import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { orders, userSessions, profiles } from "@shared/schema";
import { eq, and, gt, desc } from "drizzle-orm";

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

function mapOrder(o: any) {
  return {
    id: o.id,
    user_id: o.userId,
    items: o.items,
    total: o.total,
    subtotal: o.subtotal,
    gst: o.gst,
    delivery_charge: o.deliveryCharge,
    discount: o.discount,
    coupon_code: o.couponCode,
    status: o.status,
    shipping_name: o.shippingName,
    shipping_phone: o.shippingPhone,
    shipping_address: o.shippingAddress,
    email: o.email,
    razorpay_order_id: o.razorpayOrderId,
    razorpay_payment_id: o.razorpayPaymentId,
    payment_method: o.paymentMethod,
    payment_status: o.paymentStatus,
    tracking_id: o.trackingId,
    tracking_status: o.trackingStatus,
    tracking_location: o.trackingLocation,
    tracking_eta: o.trackingEta,
    tracking_events: o.trackingEvents,
    ckship_shipment_id: o.ckshipShipmentId,
    awb_number: o.awbNumber,
    courier_name: o.courierName,
    shipment_status: o.shipmentStatus,
    created_at: o.createdAt,
  };
}

export const Route = createFileRoute("/api/user/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await requireUser(request);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        if (id) {
          const row = await db.select().from(orders).where(and(eq(orders.id, id), eq(orders.userId, user.id))).limit(1);
          return Response.json({ order: row[0] ? mapOrder(row[0]) : null });
        }

        const rows = await db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt)).limit(50);
        return Response.json({ orders: rows.map(mapOrder) });
      },
    },
  },
});
