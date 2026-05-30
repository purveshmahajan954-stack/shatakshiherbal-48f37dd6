import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  IndianRupee,
  ShoppingBag,
  Users as UsersIcon,
  MessageSquare,
  Loader2,
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
  total: number;
  payment_status: string;
  status: string;
  created_at: string;
  shipping_name: string | null;
  email: string | null;
};

type Lead = {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
};

function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    (async () => {
      setBusy(true);
      const [ordersRes, leadsRes, profilesRes] = await Promise.all([
        supabase.from("orders").select("id,total,payment_status,status,created_at,shipping_name,email").order("created_at", { ascending: false }).limit(500),
        supabase.from("contact_messages").select("id,name,email,status,created_at").order("created_at", { ascending: false }).limit(20),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      setOrders((ordersRes.data as Order[]) || []);
      setLeads((leadsRes.data as Lead[]) || []);
      setUserCount(profilesRes.count || 0);
      setBusy(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.payment_status === "paid");
    const revenue = paid.reduce((s, o) => s + Number(o.total || 0), 0);
    const newLeads = leads.filter((l) => l.status === "new").length;
    return { revenue, orderCount: orders.length, paidCount: paid.length, newLeads };
  }, [orders, leads]);

  const chartData = useMemo(() => {
    const days = 14;
    const map = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, 0);
    }
    for (const o of orders) {
      if (o.payment_status !== "paid") continue;
      const key = o.created_at.slice(0, 10);
      if (map.has(key)) map.set(key, (map.get(key) || 0) + Number(o.total || 0));
    }
    return Array.from(map.entries()).map(([date, value]) => ({
      date: date.slice(5),
      revenue: value,
    }));
  }, [orders]);

  if (busy) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  const activity = [
    ...orders.slice(0, 5).map((o) => ({
      type: "order" as const,
      id: o.id,
      title: `Order ${o.shipping_name || o.email || "—"}`,
      sub: `₹${Number(o.total).toLocaleString("en-IN")} • ${o.payment_status}`,
      at: o.created_at,
    })),
    ...leads.slice(0, 5).map((l) => ({
      type: "lead" as const,
      id: l.id,
      title: `Lead from ${l.name}`,
      sub: `${l.email} • ${l.status}`,
      at: l.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={IndianRupee} label="Revenue (paid)" value={`₹${stats.revenue.toLocaleString("en-IN")}`} />
        <Stat icon={ShoppingBag} label="Total orders" value={String(stats.orderCount)} />
        <Stat icon={MessageSquare} label="New leads" value={String(stats.newLeads)} />
        <Stat icon={UsersIcon} label="Total users" value={String(userCount)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4">
          <h3 className="font-display text-lg mb-1">Revenue — last 14 days</h3>
          <p className="text-xs text-muted-foreground mb-4">Paid order revenue per day</p>
          <div className="h-64">
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

        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-display text-lg mb-1">Recent activity</h3>
          <p className="text-xs text-muted-foreground mb-4">Latest orders and leads</p>
          <ul className="space-y-3">
            {activity.length === 0 ? (
              <li className="text-sm text-muted-foreground">Nothing yet.</li>
            ) : (
              activity.map((a) => (
                <li key={`${a.type}-${a.id}`} className="flex items-start gap-3 text-sm">
                  <span
                    className={`mt-1 inline-block w-2 h-2 rounded-full ${
                      a.type === "order" ? "bg-primary" : "bg-amber-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{a.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{a.sub}</div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(a.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof IndianRupee;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg mb-2 bg-primary/10 text-primary">
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold text-foreground mt-0.5">{value}</div>
    </div>
  );
}
