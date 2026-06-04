import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { orders } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@server/admin-auth";

export const Route = createFileRoute("/api/admin/reports")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const rows = await db
          .select()
          .from(orders)
          .where(eq(orders.paymentStatus, "paid"))
          .orderBy(desc(orders.createdAt))
          .limit(1000);

        return Response.json({ orders: rows });
      },
    },
  },
});
