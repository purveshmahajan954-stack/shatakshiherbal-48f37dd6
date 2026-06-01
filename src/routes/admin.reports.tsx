import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, Package, Users as UsersIcon } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/admin/reports")({
  component: ReportsPage,
});

type Order = {
  id: string;
  user_id: string;
  total: number;
  gst: number;
  subtotal: number;
  payment_status: string;
  created_at: string;
  shipping_name: string | null;
  email: string | null;
  items: { name: string; qty: number; price: number; slug?: string }[];
};

function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState(true);
  const [range, setRange] = useState<"daily" | "monthly">("daily");

  useEffect(() => {
    (async () => {
      setBusy(true);
      const { data } = await supabase
        .from("orders")
        .select("id,user_id,total,gst,subtotal,payment_status,created_at,shipping_name,email,items")
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false })
        .limit(2000);
      setOrders((data as unknown as Order[]) || []);
      setBusy(false);
    })();
  }, []);

  // Sales chart
  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    if (range === "daily") {
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        map.set(d.toISOString().slice(0, 10), 0);
      }
      for (const o of orders) {
        const key = o.created_at.slice(0, 10);
        if (map.has(key)) map.set(key, (map.get(key) || 0) + Number(o.total || 0));
      }
      return Array.from(map.entries()).map(([k, v]) => ({ label: k.slice(5), value: v }));
    }
    // monthly: last 12 months
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      map.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
    }
    for (const o of orders) {
      const key = o.created_at.slice(0, 7);
      if (map.has(key)) map.set(key, (map.get(key) || 0) + Number(o.total || 0));
    }
    return Array.from(map.entries()).map(([k, v]) => ({ label: k.slice(2), value: v }));
  }, [orders, range]);

  // Top products by qty + revenue
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of orders) {
      for (const it of o.items || []) {
        const key = it.name;
        const cur = map.get(key) || { name: it.name, qty: 0, revenue: 0 };
        cur.qty += Number(it.qty || 0);
        cur.revenue += Number(it.qty || 0) * Number(it.price || 0);
        map.set(key, cur);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [orders]);

  // Top customers
  const topCustomers = useMemo(() => {
    const map = new Map<string, { name: string; email: string | null; orders: number; spent: number }>();
    for (const o of orders) {
      const key = o.user_id;
      const cur = map.get(key) || { name: o.shipping_name || "—", email: o.email, orders: 0, spent: 0 };
      cur.orders += 1;
      cur.spent += Number(o.total || 0);
      if (!cur.name && o.shipping_name) cur.name = o.shipping_name;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.spent - a.spent).slice(0, 10);
  }, [orders]);

  if (busy) return <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>;

  return (
    <div className="space-y-5">
      {/* Sales chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Sales</h3>
            <p className="text-xs text-muted-foreground">Revenue from paid orders</p>
          </div>
          <div className="flex gap-1">
            {(["daily", "monthly"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs rounded-lg capitalize ${
                  range === r ? "bg-primary text-primary-foreground" : "bg-background border border-border hover:bg-muted"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" }}
                formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Sales"]}
              />
              <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top products */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-display text-lg flex items-center gap-2 mb-3"><Package className="w-5 h-5 text-primary" /> Top selling products</h3>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No sales yet.</p>
          ) : (
            <ol className="space-y-2">
              {topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-muted/30">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold inline-flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="flex-1 truncate font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{p.qty} sold</span>
                  <span className="font-semibold whitespace-nowrap">₹{p.revenue.toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Top customers */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-display text-lg flex items-center gap-2 mb-3"><UsersIcon className="w-5 h-5 text-primary" /> Most active customers</h3>
          {topCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No customers yet.</p>
          ) : (
            <ol className="space-y-2">
              {topCustomers.map((c, i) => (
                <li key={i} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-muted/30">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold inline-flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.email}</div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{c.orders} order{c.orders === 1 ? "" : "s"}</span>
                  <span className="font-semibold whitespace-nowrap">₹{c.spent.toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
