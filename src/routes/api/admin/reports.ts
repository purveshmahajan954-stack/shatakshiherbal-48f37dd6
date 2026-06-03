import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { orders, profiles, adminSessions } from "@shared/schema";
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
          .limit(2000);

        return Response.json({ orders: rows });
      },
    },
  },
});
