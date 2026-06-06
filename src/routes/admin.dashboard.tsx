import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

type DashStats = {
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

let _cache: { stats: DashStats; chartData: ChartPoint[]; userCount: number; ts: number } | null = null;
const CACHE_TTL_MS = 60_000;

function Dashboard() {
  const [stats, setStats] = useState<DashStats | null>(_cache?.stats ?? null);
  const [chartData, setChartData] = useState<ChartPoint[]>(_cache?.chartData ?? []);
  const [userCount, setUserCount] = useState(_cache?.userCount ?? 0);
  const [busy, setBusy] = useState(!_cache || Date.now() - _cache.ts > CACHE_TTL_MS);

  useEffect(() => {
    if (_cache && Date.now() - _cache.ts < CACHE_TTL_MS) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      try {
        const data = await adminGet<{ stats: DashStats; chartData: ChartPoint[]; userCount: number }>(
          "/api/admin/dashboard"
        );
        if (cancelled) return;
        _cache = { stats: data.stats, chartData: data.chartData, userCount: data.userCount, ts: Date.now() };
        setStats(data.stats);
        setChartData(data.chartData);
        setUserCount(data.userCount);
      } catch {
        // show empty state on error
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (busy) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  const s = stats ?? {
    orderCount: 0, paidCount: 0, pendingCount: 0, deliveredCount: 0,
    today: { subtotal: 0, total: 0, count: 0 },
    month: { subtotal: 0, total: 0, count: 0 },
    year: { subtotal: 0, total: 0, count: 0 },
    allTime: { subtotal: 0, total: 0 },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={ShoppingBag} label="Total orders" value={String(s.orderCount)} />
        <Stat icon={UsersIcon} label="Total customers" value={String(userCount)} />
        <Stat icon={Clock} label="Pending orders" value={String(s.pendingCount)} accent="amber" />
        <Stat icon={CheckCircle2} label="Delivered orders" value={String(s.deliveredCount)} accent="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <RevenueCard title="Today" data={s.today} />
        <RevenueCard title="This month" data={s.month} />
        <RevenueCard title="This year" data={s.year} />
      </div>

      <div className="bg-card border border-border rounded-xl p-5 flex flex-wrap items-center gap-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">All-time revenue (paid orders)</div>
          <div className="text-2xl font-bold mt-1">₹{Number(s.allTime.total).toLocaleString("en-IN")}</div>
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
      <div className="text-3xl font-bold text-foreground">₹{Number(data.total).toLocaleString("en-IN")}</div>
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
