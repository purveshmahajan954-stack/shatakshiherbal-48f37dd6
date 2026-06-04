import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { adminGet } from "@/lib/api-client";
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

type Stats = {
  orderCount: number;
  paidCount: number;
  pendingCount: number;
  deliveredCount: number;
  today: { subtotal: number; total: number; count: number };
  month: { subtotal: number; total: number; count: number };
  year: { subtotal: number; total: number; count: number };
  allTime: { subtotal: number; total: number };
};
type ChartPoint = { date: string; revenue: number };
type RecentOrder = {
  id: string;
  shippingName: string | null;
  email: string | null;
  total: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
};

function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    (async () => {
      setBusy(true);
      try {
        const data = await adminGet<{
          stats: Stats;
          chartData: ChartPoint[];
          recentOrders: RecentOrder[];
          userCount: number;
        }>("/api/admin/dashboard");
        setStats(data.stats);
        setChartData(data.chartData ?? []);
        setRecentOrders(data.recentOrders ?? []);
        setUserCount(data.userCount ?? 0);
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  if (busy) return <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>;
  if (!stats) return null;

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
        <div className="flex-1 grid grid-cols-2 gap-6 min-w-[200px]">
          <Mini label="All-time revenue (products)" value={stats.allTime.subtotal} />
          <Mini label="All-time total revenue" value={stats.allTime.total} bold />
        </div>
      </div>
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
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" }}
                formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      {recentOrders.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-display text-lg mb-3">Recent Orders</h3>
          <div className="divide-y divide-border">
            {recentOrders.slice(0, 10).map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <span className="flex-1 font-medium">{o.shippingName || "—"}</span>
                <span className="text-muted-foreground text-xs">{new Date(o.createdAt).toLocaleDateString("en-IN")}</span>
                <span className="font-semibold">₹{Number(o.total).toLocaleString("en-IN")}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${o.paymentStatus === "paid" ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"}`}>{o.paymentStatus}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RevenueCard({ title, data }: { title: string; data: { subtotal: number; total: number; count: number } }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-display text-base">{title}</h4>
        <span className="text-xs text-muted-foreground">{data.count} order{data.count === 1 ? "" : "s"}</span>
      </div>
      <div className="text-3xl font-bold text-foreground mb-3">₹{data.total.toLocaleString("en-IN")}</div>
      <div className="text-sm">
        <div className="text-xs text-muted-foreground">Product Revenue</div>
        <div className="font-medium">₹{data.subtotal.toLocaleString("en-IN")}</div>
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

void IndianRupee;
