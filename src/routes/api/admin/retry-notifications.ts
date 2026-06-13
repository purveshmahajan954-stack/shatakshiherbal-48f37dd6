import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { notificationQueue } from "@shared/schema";
import { eq, and, lte, desc } from "drizzle-orm";
import { requireAdmin } from "@server/admin-auth";
import { processNotificationQueue } from "@server/notify";

export const Route = createFileRoute("/api/admin/retry-notifications")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const url = new URL(request.url);
        const status = url.searchParams.get("status") ?? "pending";
        const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 200);

        const rows = await db
          .select()
          .from(notificationQueue)
          .where(eq(notificationQueue.status, status))
          .orderBy(desc(notificationQueue.createdAt))
          .limit(limit);

        const counts = await db
          .select({ status: notificationQueue.status })
          .from(notificationQueue);

        const summary = counts.reduce<Record<string, number>>((acc, r) => {
          acc[r.status] = (acc[r.status] ?? 0) + 1;
          return acc;
        }, {});

        return Response.json({ items: rows, summary });
      },

      POST: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        let body: any = {};
        try { body = await request.json(); } catch { /* empty body is fine */ }

        // If a specific item ID is provided, mark it for immediate retry
        if (body?.id) {
          const now = new Date();
          const updated = await db
            .update(notificationQueue)
            .set({ status: "pending", nextRetryAt: now, lastError: null })
            .where(
              and(
                eq(notificationQueue.id, body.id),
                eq(notificationQueue.status, "failed"),
              )
            )
            .returning({ id: notificationQueue.id });

          if (updated.length === 0) {
            return Response.json({ error: "Item not found or not in failed state" }, { status: 404 });
          }
        }

        // Reset all failed items for retry if requested
        if (body?.resetAll) {
          await db
            .update(notificationQueue)
            .set({ status: "pending", nextRetryAt: new Date(), lastError: null })
            .where(eq(notificationQueue.status, "failed"));
        }

        // Process the queue now
        const result = await processNotificationQueue();

        return Response.json({
          ok: true,
          processed: result.processed,
          failed: result.failed,
          message: `Processed ${result.processed} notification(s). ${result.failed} still failing.`,
        });
      },
    },
  },
});
