import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { orders, userSessions, profiles } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import { cancelCKShipShipment } from "@server/ckship";

import { CANCEL_WINDOW_HOURS } from "@/lib/order-constants";
export { CANCEL_WINDOW_HOURS };

const NON_CANCELLABLE = new Set(["processing", "shipped", "delivered", "cancelled", "failed"]);
const NON_CANCELLABLE_TRACKING = new Set([
  "Shipped", "In Transit", "Out for Delivery", "Delivered", "RTO", "Returned",
]);

async function requireUser(request: Request) {
  const auth = request.headers.get("authorization");
  const cookieHeader = request.headers.get("cookie") ?? "";
  let token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/);
    token = match?.[1] ?? null;
  }
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

export async function triggerRazorpayRefund(
  paymentId: string,
): Promise<{ ok: boolean; refundId?: string; error?: string }> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return { ok: false, error: "Razorpay keys not configured" };

  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  try {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}), // empty = full refund
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data?.error?.description ?? "Refund API error" };
    }
    return { ok: true, refundId: data.id };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export const Route = createFileRoute("/api/orders/cancel")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await requireUser(request);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        let body: any;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const { orderId, reason } = body ?? {};
        if (!orderId) return Response.json({ error: "Missing orderId" }, { status: 400 });

        // Fetch the order
        const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
        if (rows.length === 0) return Response.json({ error: "Order not found" }, { status: 404 });
        const order = rows[0];

        // Verify ownership
        if (order.userId !== (user as any).id)
          return Response.json({ error: "Forbidden" }, { status: 403 });

        // Already cancelled?
        if (order.status === "cancelled")
          return Response.json({ error: "Order already cancelled" }, { status: 400 });

        // Non-cancellable order status?
        if (NON_CANCELLABLE.has(order.status))
          return Response.json(
            { error: `Cannot cancel an order that is '${order.status}'` },
            { status: 400 },
          );

        // Non-cancellable tracking status (courier already in motion)?
        if (order.trackingStatus && NON_CANCELLABLE_TRACKING.has(order.trackingStatus))
          return Response.json(
            { error: `Order is already ${order.trackingStatus} — cancel nahi ho sakta` },
            { status: 400 },
          );

        const isCod = order.paymentMethod === "cod";

        // Prepaid: block if shipment dispatched (COD gets more leniency — tracked via trackingStatus above)
        if (!isCod && order.shipmentStatus === "Created")
          return Response.json(
            { error: "Shipment already dispatched. Please contact support to cancel." },
            { status: 400 },
          );

        // Cancel window check
        const hoursElapsed =
          (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
        if (hoursElapsed > CANCEL_WINDOW_HOURS)
          return Response.json(
            { error: `Cancellation window of ${CANCEL_WINDOW_HOURS} hours has passed` },
            { status: 400 },
          );

        // Build update payload
        const patch: Record<string, any> = {
          status: "cancelled",
          trackingUpdatedAt: new Date(),
          cancelReason: reason ? String(reason).slice(0, 500) : null,
        };

        // COD with existing shipment → cancel CKShip shipment (best-effort)
        let ckshipCancelResult: { success: boolean; message: string } | null = null;
        if (isCod && order.awbNumber) {
          try {
            ckshipCancelResult = await cancelCKShipShipment(order.awbNumber);
            if (ckshipCancelResult.success) {
              patch.shipmentStatus = "Cancelled";
            }
          } catch (e) {
            console.warn("[cancel] CKShip cancel failed (proceeding anyway):", e);
          }
        }

        // Prepaid + paid → auto Razorpay refund
        let refundResult: { ok: boolean; refundId?: string; error?: string } | null = null;
        const isPaid = order.paymentStatus === "paid" || order.paymentStatus === "confirmed";

        if (!isCod && isPaid && order.razorpayPaymentId) {
          refundResult = await triggerRazorpayRefund(order.razorpayPaymentId);
          if (refundResult.ok) {
            patch.paymentStatus = "refunded";
          }
        }

        await db.update(orders).set(patch).where(eq(orders.id, orderId));

        return Response.json({ ok: true, refund: refundResult, ckship: ckshipCancelResult });
      },
    },
  },
});
