import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { orders, userSessions, profiles, products as productsTable } from "@shared/schema";
import { eq, and, gt, inArray } from "drizzle-orm";
import { z } from "zod";
import { randomHex } from "@server/password";

const RAZORPAY_BASE = "https://api.razorpay.com/v1";
const COURIER_CHARGE = 150;

function rzpAuthHeader() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) throw new Error("Razorpay keys not configured");
  return "Basic " + btoa(`${id}:${secret}`);
}

// GST @ 12% inclusive in MRP (Ayurvedic products HSN 3004)
// Back-calculate: gst = MRP × 12/112
function computeTotals(subtotal: number) {
  const sub = Math.max(0, Math.round(subtotal));
  const gst = Math.round(sub * 12 / 112);
  const delivery = sub === 0 ? 0 : COURIER_CHARGE;
  return { subtotal: sub, gst, delivery, total: sub + delivery };
}

const cartItemSchema = z.object({
  slug: z.string().min(1).max(200),
  qty: z.number().int().min(1).max(99),
  name: z.string().optional(),
  price: z.number().optional(),
  image: z.string().optional(),
});

const bodySchema = z.object({
  items: z.array(cartItemSchema).min(1).max(50),
  shipping: z.object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(7).max(20),
    email: z.string().trim().email().max(255),
    address: z.string().trim().min(5).max(1000),
  }),
});

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

export const Route = createFileRoute("/api/payments/create-order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await requireUser(request);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        let rawBody: any;
        try { rawBody = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

        const parsed = bodySchema.safeParse(rawBody);
        if (!parsed.success) return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

        const { items, shipping } = parsed.data;
        let trustedItems: Array<{ slug: string; name: string; price: number; qty: number; image: string }>;
        try {
          const slugs = items.map((i) => i.slug);
          const dbProducts = await db
            .select({ slug: productsTable.slug, name: productsTable.name, price: productsTable.price, imageUrl: productsTable.imageUrl, active: productsTable.active })
            .from(productsTable)
            .where(inArray(productsTable.slug, slugs));
          const dbMap = new Map(dbProducts.map((p) => [p.slug, p]));
          trustedItems = items.map((i) => {
            const product = dbMap.get(i.slug);
            if (!product || !product.active) throw new Error(`Unknown product: ${i.slug}`);
            const price = Math.round(Number(product.price));
            if (!Number.isFinite(price) || price < 0) throw new Error(`Invalid price for product: ${i.slug}`);
            return { slug: product.slug, name: product.name, price, qty: i.qty, image: product.imageUrl || i.image || "" };
          });
        } catch (err: any) {
          return Response.json({ error: err?.message ?? "Invalid cart items" }, { status: 400 });
        }
        const subtotal = trustedItems.reduce((s, i) => s + i.price * i.qty, 0);
        const totals = computeTotals(subtotal);

        if (totals.total < 1) return Response.json({ error: "Order total must be at least ₹1" }, { status: 400 });

        const rzpRes = await fetch(`${RAZORPAY_BASE}/orders`, {
          method: "POST",
          headers: { Authorization: rzpAuthHeader(), "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: totals.total * 100,
            currency: "INR",
            receipt: `rcpt_${Date.now()}_${user.id.slice(0, 8)}`,
            notes: { user_id: user.id, email: shipping.email },
          }),
        });

        if (!rzpRes.ok) {
          const errText = await rzpRes.text();
          console.error("Razorpay order create failed:", errText);
          return Response.json({ error: "Could not initiate payment. Please try again." }, { status: 500 });
        }

        const rzpOrder = (await rzpRes.json()) as { id: string; amount: number; currency: string };
        const trackingId = `SHIP-${randomHex(4).toUpperCase().slice(0, 6)}`;

        const [orderRow] = await db.insert(orders).values({
          userId: user.id,
          items: trustedItems,
          email: shipping.email,
          shippingName: shipping.name,
          shippingPhone: shipping.phone,
          shippingAddress: shipping.address,
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

        return Response.json({
          razorpayOrderId: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          orderId: orderRow.id,
          totals,
        });
      },
    },
  },
});
