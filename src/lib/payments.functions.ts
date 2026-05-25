import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
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

// ---------- Coupons ----------
const COUPONS: Record<string, { type: "percent" | "flat"; value: number; min?: number }> = {
  HERBAL10: { type: "percent", value: 10, min: 499 },
  WELCOME50: { type: "flat", value: 50, min: 299 },
  FREESHIP: { type: "flat", value: 60, min: 0 }, // effectively waives delivery
};

export function applyCoupon(subtotal: number, code?: string | null) {
  if (!code) return { discount: 0, code: null as string | null };
  const c = COUPONS[code.toUpperCase()];
  if (!c) return { discount: 0, code: null };
  if (c.min && subtotal < c.min) return { discount: 0, code: null };
  const discount = c.type === "percent" ? Math.round((subtotal * c.value) / 100) : c.value;
  return { discount: Math.min(discount, subtotal), code: code.toUpperCase() };
}

// Pricing helpers shared with the UI
export function computeTotals(subtotal: number, couponCode?: string | null) {
  const { discount, code } = applyCoupon(subtotal, couponCode);
  const afterDiscount = Math.max(0, subtotal - discount);
  const delivery = afterDiscount >= 999 ? 0 : afterDiscount === 0 ? 0 : 60;
  const gst = Math.round(afterDiscount * 0.05); // 5% GST on Ayurvedic products
  const total = afterDiscount + delivery + gst;
  return { subtotal, discount, couponCode: code, delivery, gst, total };
}

// ---------- Schemas ----------
const cartItemSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().min(0).max(1_000_000),
  qty: z.number().int().min(1).max(99),
  image: z.string().max(1000).optional(),
  slug: z.string().max(200).optional(),
});

const createOrderInput = z.object({
  items: z.array(cartItemSchema).min(1).max(50),
  shipping: z.object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(7).max(20),
    email: z.string().trim().email().max(255),
    address: z.string().trim().min(5).max(1000),
  }),
  couponCode: z.string().trim().max(40).optional().nullable(),
});

// ---------- Server-side price recomputation (NEVER trust client totals) ----------
function recomputeFromItems(items: z.infer<typeof cartItemSchema>[], couponCode?: string | null) {
  const subtotal = items.reduce((s, i) => s + Math.round(i.price) * i.qty, 0);
  return computeTotals(subtotal, couponCode);
}

// ---------- Create Razorpay order + persist draft order row ----------
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createOrderInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const totals = recomputeFromItems(data.items, data.couponCode);

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

    // Persist draft order
    const { data: orderRow, error } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        items: data.items,
        email: data.shipping.email,
        shipping_name: data.shipping.name,
        shipping_phone: data.shipping.phone,
        shipping_address: data.shipping.address,
        subtotal: totals.subtotal,
        discount: totals.discount,
        coupon_code: totals.couponCode,
        delivery_charge: totals.delivery,
        gst: totals.gst,
        total: totals.total,
        razorpay_order_id: rzpOrder.id,
        payment_status: "created",
        status: "pending",
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
    if (error) throw new Error(error.message);
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
    if (error) throw new Error(error.message);
    return { order };
  });
