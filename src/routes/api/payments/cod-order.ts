import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { orders, userSessions, profiles, products as productsTable } from "@shared/schema";
import { eq, and, gt, inArray } from "drizzle-orm";
import { z } from "zod";
import { randomHex } from "@server/password";
import { createCKShipShipment } from "@server/ckship";

const COURIER_CHARGE = 220; // COD handling charge

// GST @ 5% inclusive in MRP (Ayurvedic products)
// Back-calculate: gst = MRP × 5/105
function computeTotals(subtotal: number) {
  const sub = Math.max(0, Math.round(subtotal));
  const gst = Math.round(sub * 5 / 105);
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

export const Route = createFileRoute("/api/payments/cod-order")({
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

        const slugs = items.map((i) => i.slug);
        let trustedItems: Array<{ slug: string; name: string; price: number; qty: number; image: string }>;
        try {
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
          razorpayOrderId: null,
          razorpayPaymentId: null,
          paymentMethod: "cod",
          paymentStatus: "cod_pending",
          status: "confirmed",
          trackingId,
          trackingStatus: "Order Placed",
          trackingEta: "3-5 days",
        }).returning({ id: orders.id });

        // Auto-create CKShip shipment in background — saves result/error to DB
        (async () => {
          try {
            const result = await createCKShipShipment({
              id: orderRow.id,
              shippingName: shipping.name,
              shippingPhone: shipping.phone,
              shippingAddress: shipping.address,
              items: trustedItems,
              total: totals.total,
              paymentMethod: "cod",
            });

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

            console.log(`[cod-order] CKShip shipment created for order ${orderRow.id}, AWB: ${result.awbNumber}`);
          } catch (err) {
            const reason = err instanceof Error ? err.message : String(err);
            console.error(`[cod-order] Auto-CKShip failed for order ${orderRow.id}:`, reason);

            await db.update(orders).set({
              shipmentStatus: "Shipment Failed - Retry Needed",
              shipmentFailedReason: reason.slice(0, 500),
            }).where(eq(orders.id, orderRow.id));
          }
        })();

        // Notify admin of new COD order in background
        import("@server/notify").then(({ notifyPaymentSuccess }) => {
          notifyPaymentSuccess({
            id: orderRow.id,
            razorpayOrderId: null,
            razorpayPaymentId: null,
            shippingName: shipping.name,
            shippingPhone: shipping.phone,
            shippingAddress: shipping.address,
            email: shipping.email,
            total: totals.total,
            items: trustedItems,
            paymentMethod: "cod",
          }).catch((err) => console.error("[cod-order] notify error:", err));
        }).catch(() => {});

        return Response.json({ orderId: orderRow.id, totals });
      },
    },
  },
});
