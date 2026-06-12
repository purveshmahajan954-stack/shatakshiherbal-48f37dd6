import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { db } from "@server/db";
import { orders } from "@shared/schema";
import { getUserFromToken } from "@server/auth";
import { getProductBySlug } from "@/lib/products";
import { randomHex, hmacSha256, timingSafeEqual } from "@server/password";
import { eq, and, desc } from "drizzle-orm";

const RAZORPAY_BASE = "https://api.razorpay.com/v1";

function rzpAuthHeader() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) throw new Error("Razorpay keys not configured");
  return "Basic " + btoa(`${id}:${secret}`);
}

async function requireAuth() {
  let token: string | null = null;
  try {
    const auth = getRequestHeader("authorization");
    if (auth?.startsWith("Bearer ")) token = auth.slice(7);
  } catch {}
  if (!token) {
    try { token = getCookie("auth_token") ?? null; } catch {}
  }
  if (!token) throw new Error("Unauthorized — please sign in");
  const user = await getUserFromToken(token);
  if (!user) throw new Error("Session expired — please sign in again");
  return user;
}

export const getRazorpayKeyId = createServerFn({ method: "GET" }).handler(async () => {
  const id = process.env.RAZORPAY_KEY_ID;
  if (!id) throw new Error("Razorpay not configured");
  return { keyId: id };
});

export const GST_RATE = 0;
export const COURIER_CHARGE = 150;

export function computeTotals(subtotal: number) {
  const sub = Math.max(0, Math.round(subtotal));
  const gst = 0;
  const delivery = sub === 0 ? 0 : COURIER_CHARGE;
  const total = sub + delivery;
  return { subtotal: sub, gst, delivery, total };
}

const cartItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  price: z.number().min(0).max(1_000_000).optional(),
  qty: z.number().int().min(1).max(99),
  image: z.string().max(1000).optional(),
  slug: z.string().min(1).max(200),
});

const createOrderInput = z.object({
  items: z.array(cartItemSchema).min(1).max(50),
  shipping: z.object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(7).max(20),
    email: z.string().trim().email().max(255),
    address: z.string().trim().min(5).max(1000),
  }),
});

function recomputeFromItems(items: z.infer<typeof cartItemSchema>[]) {
  const trustedItems = items.map((i) => {
    const product = getProductBySlug(i.slug);
    if (!product) throw new Error(`Unknown product: ${i.slug}`);
    return { slug: product.slug, name: product.name, price: Math.round(product.price), qty: i.qty, image: product.image };
  });
  const subtotal = trustedItems.reduce((s, i) => s + i.price * i.qty, 0);
  return { trustedItems, ...computeTotals(subtotal) };
}

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createOrderInput.parse(input))
  .handler(async ({ data }) => {
    const user = await requireAuth();
    const userId = user.id;
    const { trustedItems, ...totals } = recomputeFromItems(data.items);

    if (totals.total < 1) throw new Error("Order total must be at least ₹1");

    const rzpRes = await fetch(`${RAZORPAY_BASE}/orders`, {
      method: "POST",
      headers: { Authorization: rzpAuthHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: totals.total * 100,
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        notes: { user_id: userId, email: data.shipping.email },
      }),
    });

    if (!rzpRes.ok) {
      const errText = await rzpRes.text();
      console.error("Razorpay order create failed:", errText);
      throw new Error("Could not initiate payment. Please try again.");
    }
    const rzpOrder = (await rzpRes.json()) as { id: string; amount: number; currency: string };

    const trackingId = `SHIP-${randomHex(4).toUpperCase().slice(0, 6)}`;

    const [orderRow] = await db.insert(orders).values({
      userId,
      items: trustedItems,
      email: data.shipping.email,
      shippingName: data.shipping.name,
      shippingPhone: data.shipping.phone,
      shippingAddress: data.shipping.address,
      subtotal: String(totals.subtotal),
      discount: "0",
      couponCode: null,
      deliveryCharge: String(totals.delivery),
      gst: String(totals.gst),
      total: String(totals.total),
      razorpayOrderId: rzpOrder.id,
      paymentStatus: "created",
      status: "pending",
      trackingId,
      trackingStatus: "Order Placed",
      trackingEta: "3-5 days",
    }).returning({ id: orders.id });

    if (!orderRow) throw new Error("Could not save order");

    return { razorpayOrderId: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency, orderId: orderRow.id, totals };
  });

const verifyInput = z.object({
  razorpay_order_id: z.string().min(5).max(80),
  razorpay_payment_id: z.string().min(5).max(80),
  razorpay_signature: z.string().min(10).max(256),
});

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => verifyInput.parse(input))
  .handler(async ({ data }) => {
    const user = await requireAuth();
    const userId = user.id;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("Razorpay not configured");

    const expected = await hmacSha256(secret, `${data.razorpay_order_id}|${data.razorpay_payment_id}`);
    const valid = timingSafeEqual(expected, data.razorpay_signature);

    if (!valid) {
      await db.update(orders).set({ paymentStatus: "signature_failed", status: "failed" })
        .where(and(eq(orders.razorpayOrderId, data.razorpay_order_id), eq(orders.userId, userId)));
      throw new Error("Payment verification failed. Invalid signature.");
    }

    const [updated] = await db.update(orders)
      .set({ paymentStatus: "paid", status: "confirmed", razorpayPaymentId: data.razorpay_payment_id })
      .where(and(eq(orders.razorpayOrderId, data.razorpay_order_id), eq(orders.userId, userId)))
      .returning({ id: orders.id });

    if (!updated) throw new Error("Could not finalize order");
    return { success: true, orderId: updated.id };
  });

export const markPaymentFailed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ razorpay_order_id: z.string().min(5).max(80), reason: z.string().max(500).optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    const user = await requireAuth();
    await db.update(orders).set({ paymentStatus: "failed", status: "failed" })
      .where(and(eq(orders.razorpayOrderId, data.razorpay_order_id), eq(orders.userId, user.id)));
    return { ok: true };
  });

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const user = await requireAuth();
    const orderList = await db
      .select({
        id: orders.id,
        items: orders.items,
        total: orders.total,
        subtotal: orders.subtotal,
        deliveryCharge: orders.deliveryCharge,
        gst: orders.gst,
        discount: orders.discount,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        shippingName: orders.shippingName,
        shippingPhone: orders.shippingPhone,
        shippingAddress: orders.shippingAddress,
        email: orders.email,
        razorpayOrderId: orders.razorpayOrderId,
        razorpayPaymentId: orders.razorpayPaymentId,
        trackingId: orders.trackingId,
        trackingStatus: orders.trackingStatus,
        trackingLocation: orders.trackingLocation,
        trackingEta: orders.trackingEta,
        awbNumber: orders.awbNumber,
        courierName: orders.courierName,
        shipmentStatus: orders.shipmentStatus,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.userId, user.id))
      .orderBy(desc(orders.createdAt))
      .limit(50);
    return { orders: orderList };
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const user = await requireAuth();
    const [order] = await db.select().from(orders)
      .where(and(eq(orders.id, data.id), eq(orders.userId, user.id)))
      .limit(1);
    return { order: order ?? null };
  });
