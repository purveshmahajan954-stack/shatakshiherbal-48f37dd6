import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { adminGet } from "@/lib/api-client";
import {
  IndianRupee,
  ShoppingBag,
  Users as UsersIcon,
  Loader2,
  Receipt,
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
  gst: number;
  total: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
  shippingName: string | null;
  email: string | null;
};

function inRange(d: Date, start: Date) {
  return d.getTime() >= start.getTime();
}

function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    (async () => {
      setBusy(true);
      const data = await adminGet<{ orders: Order[]; userCount: number }>("/api/admin/dashboard");
      setOrders(data.orders ?? []);
      setUserCount(data.userCount ?? 0);
      setBusy(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startYear = new Date(now.getFullYear(), 0, 1);

    const paid = orders.filter((o) => o.paymentStatus === "paid");
    const sum = (arr: Order[], k: "subtotal" | "gst" | "total") => arr.reduce((s, o) => s + Number(o[k] || 0), 0);

    const todayOrders = paid.filter((o) => inRange(new Date(o.createdAt), startToday));
    const monthOrders = paid.filter((o) => inRange(new Date(o.createdAt), startMonth));
    const yearOrders = paid.filter((o) => inRange(new Date(o.createdAt), startYear));

    return {
      orderCount: orders.length,
      paidCount: paid.length,
      pendingCount: orders.filter((o) => ["pending", "processing", "confirmed", "shipped"].includes(o.status)).length,
      deliveredCount: orders.filter((o) => o.status === "delivered").length,
      today: { base: sum(todayOrders, "subtotal"), gst: sum(todayOrders, "gst"), total: sum(todayOrders, "total"), count: todayOrders.length },
      month: { base: sum(monthOrders, "subtotal"), gst: sum(monthOrders, "gst"), total: sum(monthOrders, "total"), count: monthOrders.length },
      year: { base: sum(yearOrders, "subtotal"), gst: sum(yearOrders, "gst"), total: sum(yearOrders, "total"), count: yearOrders.length },
      allTime: { base: sum(paid, "subtotal"), gst: sum(paid, "gst"), total: sum(paid, "total") },
    };
  }, [orders]);

  const chartData = useMemo(() => {
    const days = 30;
    const map = new Map<string, { revenue: number; gst: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map.set(d.toISOString().slice(0, 10), { revenue: 0, gst: 0 });
    }
    for (const o of orders) {
      if (o.paymentStatus !== "paid") continue;
      const key = (o.createdAt ?? "").slice(0, 10);
      const entry = map.get(key);
      if (entry) { entry.revenue += Number(o.total || 0); entry.gst += Number(o.gst || 0); }
    }
    return Array.from(map.entries()).map(([date, v]) => ({ date: date.slice(5), revenue: v.revenue, gst: v.gst }));
  }, [orders]);

  if (busy) return <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={ShoppingBag} label="Total orders" value={String(stats.orderCount)} />
        <Stat icon={UsersIcon} label="Total customers" value={String(userCount)} />
        <Stat icon={Clock} label="Pending orders" value={String(stats.pendingCount)} accent="amber" />
        <Stat icon={CheckCircle2} label="Delivered orders" value={String(stats.deliveredCount)} accent="green" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <RevenueCard title="Today" data={stats.today} />
        <RevenueCard title="This month" data={stats.month} />
        <RevenueCard title="This year" data={stats.year} />
      </div>
      <div className="bg-card border border-border rounded-xl p-5 flex flex-wrap items-center gap-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary"><TrendingUp className="w-6 h-6" /></div>
        <div className="flex-1 grid grid-cols-3 gap-6 min-w-[240px]">
          <Mini label="All-time base" value={stats.allTime.base} />
          <Mini label="All-time GST (5%)" value={stats.allTime.gst} />
          <Mini label="All-time revenue" value={stats.allTime.total} bold />
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-display text-lg mb-1">Revenue — last 30 days</h3>
        <p className="text-xs text-muted-foreground mb-4">Paid order revenue (base + GST) per day</p>
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
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" }} formatter={(v: number, n: string) => [`₹${v.toLocaleString("en-IN")}`, n === "revenue" ? "Revenue" : "GST"]} />
              <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function RevenueCard({ title, data }: { title: string; data: { base: number; gst: number; total: number; count: number } }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-display text-base">{title}</h4>
        <span className="text-xs text-muted-foreground">{data.count} order{data.count === 1 ? "" : "s"}</span>
      </div>
      <div className="text-3xl font-bold text-foreground mb-3">₹{data.total.toLocaleString("en-IN")}</div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><div className="text-xs text-muted-foreground">Base</div><div className="font-medium">₹{data.base.toLocaleString("en-IN")}</div></div>
        <div><div className="text-xs text-muted-foreground">GST (5%)</div><div className="font-medium text-primary">₹{data.gst.toLocaleString("en-IN")}</div></div>
      </div>
    </div>
  );
}

function Mini({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 ${bold ? "text-xl font-bold" : "text-lg font-semibold"}`}>₹{value.toLocaleString("en-IN")}</div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: typeof IndianRupee; label: string; value: string; accent?: "amber" | "green" }) {
  const accents = { amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400", green: "bg-green-500/10 text-green-600 dark:text-green-400" };
  const cls = accent ? accents[accent] : "bg-primary/10 text-primary";
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-2 ${cls}`}><Icon className="w-4 h-4" /></div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold text-foreground mt-0.5">{value}</div>
    </div>
  );
}

void Receipt;
void IndianRupee;
