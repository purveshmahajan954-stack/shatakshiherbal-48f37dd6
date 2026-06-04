import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { orders, profiles } from "@shared/schema";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@server/admin-auth";

export const Route = createFileRoute("/api/admin/customers")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const [allProfiles, allOrders] = await Promise.all([
          db.select().from(profiles).orderBy(desc(profiles.createdAt)).limit(2000),
          db.select().from(orders).orderBy(desc(orders.createdAt)).limit(2000),
        ]);

        return Response.json({ profiles: allProfiles, orders: allOrders });
      },
    },
  },
});
