import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { db } from "@server/db";
import { orders } from "@shared/schema";
import { eq } from "drizzle-orm";

const ALLOWED_STATUSES = ["Order Placed", "Packed", "Shipped", "In Transit", "Out for Delivery", "Delivered", "Cancelled"] as const;

const payloadSchema = z.object({
  tracking_id: z.string().min(4).max(32),
  status: z.enum(ALLOWED_STATUSES),
  location: z.string().max(200).optional(),
  eta: z.string().max(50).optional(),
});

export const Route = createFileRoute("/api/public/webhook-update")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.DELIVERY_WEBHOOK_SECRET;
        const provided = request.headers.get("x-webhook-secret");
        if (!secret || !provided || provided !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }

        let body: unknown;
        try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

        const parsed = payloadSchema.safeParse(body);
        if (!parsed.success) return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });

        const { tracking_id, status, location, eta } = parsed.data;
        const [data] = await db.update(orders).set({
          trackingStatus: status,
          trackingLocation: location ?? null,
          trackingEta: eta ?? null,
          trackingUpdatedAt: new Date(),
          ...(status === "Delivered" ? { status: "delivered" } : {}),
        }).where(eq(orders.trackingId, tracking_id)).returning({ id: orders.id });

        if (!data) return Response.json({ error: "Order not found" }, { status: 404 });
        return Response.json({ ok: true });
      },
    },
  },
});
