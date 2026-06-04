import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { orders, profiles } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { requireAdmin } from "@server/admin-auth";

export const Route = createFileRoute("/api/admin/dashboard")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const [allOrders, userCountRows] = await Promise.all([
          db
            .select({
              id: orders.id,
              subtotal: orders.subtotal,
              total: orders.total,
              deliveryCharge: orders.deliveryCharge,
              paymentStatus: orders.paymentStatus,
              status: orders.status,
              createdAt: orders.createdAt,
              shippingName: orders.shippingName,
              email: orders.email,
            })
            .from(orders)
            .orderBy(desc(orders.createdAt))
            .limit(2000),
          db.select({ count: sql<number>`count(*)` }).from(profiles),
        ]);

        const now = new Date();
        const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startYear = new Date(now.getFullYear(), 0, 1);

        const paid = allOrders.filter((o) => o.paymentStatus === "paid");

        function sum(arr: typeof paid) {
          return arr.reduce((s, o) => ({ subtotal: s.subtotal + Number(o.subtotal || 0), total: s.total + Number(o.total || 0) }), { subtotal: 0, total: 0 });
        }
        function inRange(o: { createdAt: Date | null }, start: Date) {
          return o.createdAt != null && new Date(o.createdAt).getTime() >= start.getTime();
        }

        const todayPaid = paid.filter((o) => inRange(o, startToday));
        const monthPaid = paid.filter((o) => inRange(o, startMonth));
        const yearPaid = paid.filter((o) => inRange(o, startYear));

        const stats = {
          orderCount: allOrders.length,
          paidCount: paid.length,
          pendingCount: allOrders.filter((o) => ["pending", "processing", "confirmed", "shipped"].includes(o.status)).length,
          deliveredCount: allOrders.filter((o) => o.status === "delivered").length,
          today: { ...sum(todayPaid), count: todayPaid.length },
          month: { ...sum(monthPaid), count: monthPaid.length },
          year: { ...sum(yearPaid), count: yearPaid.length },
          allTime: sum(paid),
        };

        const dayMap = new Map<string, number>();
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          dayMap.set(d.toISOString().slice(0, 10), 0);
        }
        for (const o of paid) {
          if (!o.createdAt) continue;
          const key = new Date(o.createdAt).toISOString().slice(0, 10);
          const cur = dayMap.get(key);
          if (cur !== undefined) dayMap.set(key, cur + Number(o.total || 0));
        }
        const chartData = Array.from(dayMap.entries()).map(([date, revenue]) => ({ date: date.slice(5), revenue }));

        const recentOrders = allOrders.slice(0, 50);

        return Response.json({ stats, chartData, recentOrders, userCount: Number(userCountRows[0]?.count ?? 0) });
      },
    },
  },
});
