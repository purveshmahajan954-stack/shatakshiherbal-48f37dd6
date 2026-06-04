import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  IndianRupee,
  ShoppingBag,
  Users as UsersIcon,
  Loader2,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/admin/dashboard")({
  component: Dashboard,
});

type Order = {
  id: string;
  subtotal: number;
  total: number;
  payment_status: string;
  status: string;
  created_at: string;
  shipping_name: string | null;
  email: string | null;
};

// Module-level cache so navigating away and back doesn't re-fetch immediately
let _cache: { orders: Order[]; userCount: number; ts: number } | null = null;
const CACHE_TTL_MS = 60_000; // 60 seconds

function inRange(d: Date, start: Date) {
  return d.getTime() >= start.getTime();
}

function Dashboard() {
  const [orders, setOrders] = useState<Order[]>(_cache?.orders ?? []);
  const [userCount, setUserCount] = useState(_cache?.userCount ?? 0);
  const [busy, setBusy] = useState(!_cache || Date.now() - _cache.ts > CACHE_TTL_MS);

  useEffect(() => {
    if (_cache && Date.now() - _cache.ts < CACHE_TTL_MS) return; // serve from cache
    let cancelled = false;
    (async () => {
      setBusy(true);
      const [ordersRes, profilesRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id,subtotal,total,payment_status,status,created_at,shipping_name,email")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      if (cancelled) return;
      const o = (ordersRes.data as Order[]) || [];
      const uc = profilesRes.count || 0;
      _cache = { orders: o, userCount: uc, ts: Date.now() };
      setOrders(o);
      setUserCount(uc);
      setBusy(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startYear = new Date(now.getFullYear(), 0, 1);

    const paid = orders.filter((o) => o.payment_status === "paid");

    const sum = (arr: Order[]) => arr.reduce((s, o) => s + Number(o.total || 0), 0);

    const todayOrders = paid.filter((o) => inRange(new Date(o.created_at), startToday));
    const monthOrders = paid.filter((o) => inRange(new Date(o.created_at), startMonth));
    const yearOrders = paid.filter((o) => inRange(new Date(o.created_at), startYear));

    return {
      orderCount: orders.length,
      paidCount: paid.length,
      pendingCount: orders.filter((o) => ["pending", "processing", "confirmed", "shipped"].includes(o.status)).length,
      deliveredCount: orders.filter((o) => o.status === "delivered").length,
      today: { total: sum(todayOrders), count: todayOrders.length },
      month: { total: sum(monthOrders), count: monthOrders.length },
      year:  { total: sum(yearOrders),  count: yearOrders.length  },
      allTime: { total: sum(paid) },
    };
  }, [orders]);

  const chartData = useMemo(() => {
    const days = 30;
    const map = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map.set(d.toISOString().slice(0, 10), 0);
    }
    for (const o of orders) {
      if (o.payment_status !== "paid") continue;
      const key = o.created_at.slice(0, 10);
      if (map.has(key)) map.set(key, map.get(key)! + Number(o.total || 0));
    }
    return Array.from(map.entries()).map(([date, revenue]) => ({
      date: date.slice(5),
      revenue,
    }));
  }, [orders]);

  if (busy) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={ShoppingBag} label="Total orders" value={String(stats.orderCount)} />
        <Stat icon={UsersIcon} label="Total customers" value={String(userCount)} />
        <Stat icon={Clock} label="Pending orders" value={String(stats.pendingCount)} accent="amber" />
        <Stat icon={CheckCircle2} label="Delivered orders" value={String(stats.deliveredCount)} accent="green" />
      </div>

      {/* Revenue blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <RevenueCard title="Today" data={stats.today} />
        <RevenueCard title="This month" data={stats.month} />
        <RevenueCard title="This year" data={stats.year} />
      </div>

      {/* All-time revenue */}
      <div className="bg-card border border-border rounded-xl p-5 flex flex-wrap items-center gap-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">All-time revenue (paid orders)</div>
          <div className="text-2xl font-bold mt-1">₹{stats.allTime.total.toLocaleString("en-IN")}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-display text-lg mb-1">Revenue — last 30 days</h3>
        <p className="text-xs text-muted-foreground mb-4">Paid order revenue per day</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--foreground)",
                }}
                formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function RevenueCard({ title, data }: { title: string; data: { total: number; count: number } }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-display text-base">{title}</h4>
        <span className="text-xs text-muted-foreground">{data.count} order{data.count === 1 ? "" : "s"}</span>
      </div>
      <div className="text-3xl font-bold text-foreground">₹{data.total.toLocaleString("en-IN")}</div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof IndianRupee;
  label: string;
  value: string;
  accent?: "amber" | "green";
}) {
  const accents = {
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    green: "bg-green-500/10 text-green-600 dark:text-green-400",
  };
  const cls = accent ? accents[accent] : "bg-primary/10 text-primary";
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-2 ${cls}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold text-foreground mt-0.5">{value}</div>
    </div>
  );
}
