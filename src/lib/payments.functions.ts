import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getProductBySlug } from "@/lib/products";
import crypto from "node:crypto";

/**
 * Razorpay integration via REST API (fetch-based for Cloudflare Workers compatibility).
 * Docs: https://razorpay.com/docs/api/
 */

const RAZORPAY_BASE = "https://api.razorpay.com/v1";

function rzpAuthHeader() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) throw new Error("Razorpay keys not configured");
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

// Publishable Key ID — safe to expose to the browser (used to open Checkout)
export const getRazorpayKeyId = createServerFn({ method: "GET" }).handler(async () => {
  const id = process.env.RAZORPAY_KEY_ID;
  if (!id) throw new Error("Razorpay not configured");
  return { keyId: id };
});

// ---------- Pricing constants ----------
export const GST_RATE = 0.05; // Fixed 5% GST on all products
export const COURIER_CHARGE = 150; // Flat ₹150 courier on every order

// Pricing helpers shared with the UI.
// No discounts, no coupons — simple flat structure.
export function computeTotals(subtotal: number) {
  const sub = Math.max(0, Math.round(subtotal));
  const gst = Math.round(sub * GST_RATE);
  const delivery = sub === 0 ? 0 : COURIER_CHARGE;
  const total = sub + gst + delivery;
  return { subtotal: sub, gst, delivery, total };
}


// ---------- Schemas ----------
// Note: client-supplied `price`, `name`, `image` are IGNORED on the server.
// The slug is the only trusted identifier; price/name/image are resolved
// from the canonical product catalog to prevent payment tampering.
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

// ---------- Server-side price recomputation (NEVER trust client totals) ----------
// Resolves each cart item against the canonical product catalog by slug.
// Returns trusted items (with server-authoritative price/name/image) plus totals.
function recomputeFromItems(items: z.infer<typeof cartItemSchema>[]) {
  const trustedItems = items.map((i) => {
    const product = getProductBySlug(i.slug);
    if (!product) throw new Error(`Unknown product: ${i.slug}`);
    return {
      slug: product.slug,
      name: product.name,
      price: Math.round(product.price),
      qty: i.qty,
      image: product.image,
    };
  });
  const subtotal = trustedItems.reduce((s, i) => s + i.price * i.qty, 0);
  return { trustedItems, ...computeTotals(subtotal) };
}

// ---------- Create Razorpay order + persist draft order row ----------
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createOrderInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { trustedItems, ...totals } = recomputeFromItems(data.items);


    if (totals.total < 1) throw new Error("Order total must be at least ₹1");

    // Create Razorpay order
    const rzpRes = await fetch(`${RAZORPAY_BASE}/orders`, {
      method: "POST",
      headers: {
        Authorization: rzpAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: totals.total * 100, // paise
        currency: "INR",
        receipt: `rcpt_${Date.now()}_${userId.slice(0, 8)}`,
        notes: {
          user_id: userId,
          email: data.shipping.email,
        },
      }),
    });

    if (!rzpRes.ok) {
      const errText = await rzpRes.text();
      console.error("Razorpay order create failed:", errText);
      throw new Error("Could not initiate payment. Please try again.");
    }
    const rzpOrder = (await rzpRes.json()) as { id: string; amount: number; currency: string };

    // Generate unique tracking ID (SHIP-XXXXXX)
    const trackingId = `SHIP-${crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6)}`;

    // Persist draft order
    const { data: orderRow, error } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        items: trustedItems,
        email: data.shipping.email,
        shipping_name: data.shipping.name,
        shipping_phone: data.shipping.phone,
        shipping_address: data.shipping.address,
        subtotal: totals.subtotal,
        discount: 0,
        coupon_code: null,
        delivery_charge: totals.delivery,
        gst: totals.gst,
        total: totals.total,
        razorpay_order_id: rzpOrder.id,
        payment_status: "created",
        status: "pending",
        tracking_id: trackingId,
        tracking_status: "Order Placed",
        tracking_eta: "3-5 days",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Order insert failed:", error);
      throw new Error("Could not save order");
    }

    return {
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      orderId: orderRow.id,
      totals,
    };
  });

// ---------- Verify signature & mark paid ----------
const verifyInput = z.object({
  razorpay_order_id: z.string().min(5).max(80),
  razorpay_payment_id: z.string().min(5).max(80),
  razorpay_signature: z.string().min(10).max(256),
});

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => verifyInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("Razorpay not configured");

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");

    const valid =
      expected.length === data.razorpay_signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(data.razorpay_signature));

    if (!valid) {
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "signature_failed", status: "failed" })
        .eq("razorpay_order_id", data.razorpay_order_id)
        .eq("user_id", userId);
      throw new Error("Payment verification failed. Invalid signature.");
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "paid",
        status: "confirmed",
        razorpay_payment_id: data.razorpay_payment_id,
      })
      .eq("razorpay_order_id", data.razorpay_order_id)
      .eq("user_id", userId)
      .select("id")
      .single();

    if (error || !order) {
      console.error("Order update failed:", error);
      throw new Error("Could not finalize order");
    }

    return { success: true, orderId: order.id };
  });

// ---------- Mark failed (called from Checkout modal on dismiss/error) ----------
export const markPaymentFailed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ razorpay_order_id: z.string().min(5).max(80), reason: z.string().max(500).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "failed", status: "failed" })
      .eq("razorpay_order_id", data.razorpay_order_id)
      .eq("user_id", context.userId);
    return { ok: true };
  });

// ---------- User's order history ----------
export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error("[getMyOrders]", error);
      throw new Error("Could not load your orders. Please try again.");
    }
    return { orders: data ?? [] };
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase
      .from("orders")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) {
      console.error("[getMyOrder]", error);
      throw new Error("Could not load this order. Please try again.");
    }
    return { order };
  });
