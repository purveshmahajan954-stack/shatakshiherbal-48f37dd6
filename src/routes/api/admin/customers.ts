import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { orders, adminSessions, profiles } from "@shared/schema";
import { eq, and, gt, desc } from "drizzle-orm";

async function requireAdmin(request: Request) {
  const token = request.headers.get("x-admin-token");
  if (!token) return null;
  const now = new Date();
  const rows = await db
    .select({ profile: profiles })
    .from(adminSessions)
    .innerJoin(profiles, eq(adminSessions.profileId, profiles.id))
    .where(and(eq(adminSessions.token, token), gt(adminSessions.expiresAt, now)))
    .limit(1);
  return rows[0]?.profile ?? null;
}

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
