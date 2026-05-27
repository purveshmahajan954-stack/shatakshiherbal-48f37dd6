import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import {
  Shield,
  ShoppingBag,
  Search,
  Loader2,
  IndianRupee,
  TrendingUp,
  Clock,
  XCircle,
  CheckCircle2,
  RotateCcw,
  ChevronDown,
  LogOut,
  Users,
  CreditCard,
  Settings as SettingsIcon,
  Menu,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Shatakshi Herbal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const ADMIN_EMAIL = "admin@shatakshiherbal.com";

type OrderItem = { name: string; qty: number; price: number; slug?: string; image?: string };
type Order = {
  id: string;
  user_id: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  delivery_charge: number;
  gst: number;
  total: number;
  coupon_code: string | null;
  email: string | null;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  payment_status: string;
  status: string;
  created_at: string;
};

const PAYMENT_STATUSES = ["created", "paid", "failed", "signature_failed", "refunded"] as const;
const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "failed"] as const;

type Section = "orders" | "customers" | "payments" | "settings";

function AdminPage() {
  const { loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
      navigate({ to: "/admin-login", replace: true });
    }
  }, [loading, user, navigate]);

  if (loading || !user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return <AdminShell />;
}

function AdminShell() {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("orders");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState(true);

  const load = async () => {
    setBusy(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) toast.error("Failed to load orders");
    setOrders((data as Order[]) || []);
    setBusy(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin-login", replace: true });
  };

  const nav: { id: Section; label: string; icon: typeof ShoppingBag }[] = [
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "customers", label: "Customers", icon: Users },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-border flex flex-col transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-16 px-5 flex items-center gap-2 border-b border-border">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-display text-lg">Admin Panel</span>
          <button
            className="ml-auto lg:hidden p-1.5 rounded-md hover:bg-muted"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = section === n.id;
            return (
              <button
                key={n.id}
                onClick={() => {
                  setSection(n.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                {n.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-border flex items-center px-4 lg:px-6 gap-3">
          <button
            className="lg:hidden p-2 rounded-md hover:bg-muted"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-display text-xl capitalize">{section}</h1>
          <button
            onClick={load}
            className="ml-auto inline-flex items-center gap-2 px-3 py-2 text-sm bg-cream border border-border rounded-lg hover:bg-muted"
          >
            <RotateCcw className="w-4 h-4" /> Refresh
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {section === "orders" && <OrdersModule orders={orders} busy={busy} reload={load} />}
          {section === "customers" && <CustomersModule orders={orders} busy={busy} />}
          {section === "payments" && <PaymentsModule orders={orders} busy={busy} />}
          {section === "settings" && <SettingsModule />}
        </main>
      </div>
    </div>
  );
}

/* ============================= ORDERS ============================= */

function OrdersModule({
  orders,
  busy,
  reload,
}: {
  orders: Order[];
  busy: boolean;
  reload: () => void;
}) {
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [localOrders, setLocalOrders] = useState(orders);

  useEffect(() => setLocalOrders(orders), [orders]);

  const metrics = useMemo(() => {
    const paid = localOrders.filter((o) => o.payment_status === "paid");
    const revenue = paid.reduce((s, o) => s + Number(o.total || 0), 0);
    const pending = localOrders.filter((o) => o.payment_status === "created").length;
    const failed = localOrders.filter(
      (o) => o.payment_status === "failed" || o.payment_status === "signature_failed",
    ).length;
    const aov = paid.length ? revenue / paid.length : 0;
    return { revenue, paidCount: paid.length, pending, failed, aov, total: localOrders.length };
  }, [localOrders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return localOrders.filter((o) => {
      if (paymentFilter !== "all" && o.payment_status !== paymentFilter) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        (o.shipping_phone || "").toLowerCase().includes(q) ||
        (o.shipping_name || "").toLowerCase().includes(q) ||
        (o.email || "").toLowerCase().includes(q) ||
        (o.razorpay_order_id || "").toLowerCase().includes(q) ||
        (o.razorpay_payment_id || "").toLowerCase().includes(q)
      );
    });
  }, [localOrders, search, paymentFilter, statusFilter]);

  const updateOrder = async (
    id: string,
    patch: Partial<Pick<Order, "status" | "payment_status">>,
  ) => {
    setUpdating(id);
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    setUpdating(null);
    if (error) {
      toast.error("Update failed");
      return;
    }
    setLocalOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    toast.success("Order updated");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={IndianRupee} label="Revenue (paid)" value={`₹${metrics.revenue.toLocaleString("en-IN")}`} tone="primary" />
        <MetricCard icon={CheckCircle2} label="Paid orders" value={String(metrics.paidCount)} tone="success" />
        <MetricCard icon={Clock} label="Pending" value={String(metrics.pending)} tone="muted" />
        <MetricCard icon={XCircle} label="Failed" value={String(metrics.failed)} tone="danger" />
      </div>

      <div className="bg-white rounded-xl shadow-card p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by phone, order ID, name, email…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-cream/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-cream/50"
          >
            <option value="all">All payments</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>Payment: {s}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-cream/50"
          >
            <option value="all">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>Status: {s}</option>
            ))}
          </select>
        </div>
      </div>

      {busy ? (
        <div className="py-16 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card py-16 text-center text-muted-foreground text-sm">
          No orders match your filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <OrderRow
              key={o.id}
              order={o}
              updating={updating === o.id}
              onUpdate={(patch) => updateOrder(o.id, patch)}
            />
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground text-right">
        Avg order value: ₹{Math.round(metrics.aov).toLocaleString("en-IN")} • {metrics.total} total
        <button onClick={reload} className="ml-2 underline hover:text-foreground">refresh</button>
      </div>
    </div>
  );
}

function OrderRow({
  order,
  updating,
  onUpdate,
}: {
  order: Order;
  updating: boolean;
  onUpdate: (patch: Partial<Pick<Order, "status" | "payment_status">>) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex flex-wrap items-center gap-3 p-4 text-left hover:bg-muted/30 transition"
      >
        <div className="flex-1 min-w-[180px]">
          <div className="font-semibold">{order.shipping_name || "—"}</div>
          <div className="text-xs text-muted-foreground">
            {fmt(order.created_at)} • #{order.id.slice(0, 8)} • {order.shipping_phone || "—"}
          </div>
        </div>
        <div className="font-semibold whitespace-nowrap">
          ₹{Number(order.total).toLocaleString("en-IN")}
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${payBadge(order.payment_status)}`}>
          {order.payment_status}
        </span>
        <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
          {order.status}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-border p-4 grid md:grid-cols-2 gap-6 bg-cream/30">
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Customer</h4>
            <div className="text-sm space-y-1">
              <div><span className="text-muted-foreground">Name:</span> {order.shipping_name || "—"}</div>
              <div><span className="text-muted-foreground">Email:</span> {order.email || "—"}</div>
              <div><span className="text-muted-foreground">Phone:</span> {order.shipping_phone || "—"}</div>
              <div className="pt-1">
                <span className="text-muted-foreground">Address:</span>
                <div className="whitespace-pre-wrap mt-0.5">{order.shipping_address || "—"}</div>
              </div>
            </div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2">Payment IDs</h4>
            <div className="text-xs font-mono space-y-1 break-all">
              <div>Order: {order.razorpay_order_id || "—"}</div>
              <div>Payment: {order.razorpay_payment_id || "—"}</div>
            </div>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Items</h4>
            <ul className="text-sm divide-y divide-border border border-border rounded-lg bg-white">
              {(order.items || []).map((it, i) => (
                <li key={i} className="flex justify-between gap-3 p-2.5">
                  <span className="flex-1">
                    {it.name} <span className="text-muted-foreground">×{it.qty}</span>
                  </span>
                  <span className="whitespace-nowrap">
                    ₹{(Number(it.price) * it.qty).toLocaleString("en-IN")}
                  </span>
                </li>
              ))}
            </ul>

            <div className="text-sm mt-3 space-y-1">
              <Row label="Subtotal" value={`₹${Number(order.subtotal).toLocaleString("en-IN")}`} />
              <Row label="Delivery" value={`₹${Number(order.delivery_charge).toLocaleString("en-IN")}`} />
              <Row label="GST (5%)" value={`₹${Number(order.gst).toLocaleString("en-IN")}`} />
              <Row label="Total" value={`₹${Number(order.total).toLocaleString("en-IN")}`} bold />
            </div>

            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2">Manage</h4>
            <div className="flex flex-wrap gap-2 items-center">
              <label className="text-xs text-muted-foreground">Order:</label>
              <select
                disabled={updating}
                value={order.status}
                onChange={(e) => onUpdate({ status: e.target.value })}
                className="text-sm border border-border rounded-lg px-2 py-1.5 bg-white"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <label className="text-xs text-muted-foreground ml-2">Payment:</label>
              <select
                disabled={updating}
                value={order.payment_status}
                onChange={(e) => onUpdate({ payment_status: e.target.value })}
                className="text-sm border border-border rounded-lg px-2 py-1.5 bg-white"
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {updating && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================== CUSTOMERS =========================== */

function CustomersModule({ orders, busy }: { orders: Order[]; busy: boolean }) {
  const customers = useMemo(() => {
    const map = new Map<
      string,
      { name: string; phone: string; email: string; count: number; last: string; total: number }
    >();
    for (const o of orders) {
      const key = (o.shipping_phone || o.email || o.user_id || "").toLowerCase();
      if (!key) continue;
      const cur = map.get(key);
      if (!cur) {
        map.set(key, {
          name: o.shipping_name || "—",
          phone: o.shipping_phone || "—",
          email: o.email || "—",
          count: 1,
          last: o.created_at,
          total: Number(o.total || 0),
        });
      } else {
        cur.count += 1;
        cur.total += Number(o.total || 0);
        if (new Date(o.created_at) > new Date(cur.last)) cur.last = o.created_at;
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.last).getTime() - new Date(a.last).getTime(),
    );
  }, [orders]);

  if (busy) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-right px-4 py-3">Orders</th>
              <th className="text-right px-4 py-3">Total spent</th>
              <th className="text-left px-4 py-3">Last order</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-muted-foreground">
                  No customers yet.
                </td>
              </tr>
            ) : (
              customers.map((c, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.phone}</td>
                  <td className="px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3 text-right">{c.count}</td>
                  <td className="px-4 py-3 text-right">
                    ₹{c.total.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">{fmt(c.last)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================ PAYMENTS ============================ */

function PaymentsModule({ orders, busy }: { orders: Order[]; busy: boolean }) {
  const totals = useMemo(() => {
    let paid = 0;
    let pending = 0;
    for (const o of orders) {
      const t = Number(o.total || 0);
      if (o.payment_status === "paid") paid += t;
      else if (o.payment_status === "created") pending += t;
    }
    return { paid, pending };
  }, [orders]);

  if (busy) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricCard icon={CheckCircle2} label="Total paid" value={`₹${totals.paid.toLocaleString("en-IN")}`} tone="success" />
        <MetricCard icon={Clock} label="Pending" value={`₹${totals.pending.toLocaleString("en-IN")}`} tone="muted" />
        <MetricCard icon={TrendingUp} label="Transactions" value={String(orders.length)} tone="primary" />
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Order ID</th>
                <th className="text-left px-4 py-3">Method</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Paid</th>
                <th className="text-right px-4 py-3">Pending</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-muted-foreground">
                    No payments yet.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const total = Number(o.total || 0);
                  const isPaid = o.payment_status === "paid";
                  return (
                    <tr key={o.id} className="border-t border-border">
                      <td className="px-4 py-3 font-mono text-xs">#{o.id.slice(0, 8)}</td>
                      <td className="px-4 py-3">Razorpay</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${payBadge(o.payment_status)}`}>
                          {o.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isPaid ? `₹${total.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isPaid ? `₹${total.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{fmt(o.created_at)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================ SETTINGS ============================ */

function SettingsModule() {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white rounded-xl shadow-card p-6">
        <h3 className="font-display text-lg mb-1">Business Settings</h3>
        <p className="text-sm text-muted-foreground mb-5">
          Pricing rules applied across the storefront.
        </p>
        <dl className="divide-y divide-border text-sm">
          <SettingRow label="GST" value="5% on all products" />
          <SettingRow label="Courier / Shipping" value="Flat ₹150 per order" />
          <SettingRow label="Coupons / Discounts" value="Disabled" />
          <SettingRow label="Currency" value="INR (₹)" />
          <SettingRow label="Payment gateway" value="Razorpay" />
        </dl>
      </div>
      <p className="text-xs text-muted-foreground">
        These values are enforced in the checkout pricing logic. To change them, update the
        pricing constants in the codebase.
      </p>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

/* ============================ SHARED ============================ */

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof IndianRupee;
  label: string;
  value: string;
  tone: "primary" | "success" | "danger" | "muted";
}) {
  const toneClasses: Record<typeof tone, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-green-100 text-green-700",
    danger: "bg-red-100 text-red-700",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <div className="bg-white rounded-xl shadow-card p-4">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-2 ${toneClasses[tone]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold text-foreground mt-0.5">{value}</div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold pt-1 border-t border-border" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function payBadge(status: string) {
  const map: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    created: "bg-amber-100 text-amber-700",
    failed: "bg-red-100 text-red-700",
    signature_failed: "bg-red-100 text-red-700",
    refunded: "bg-slate-200 text-slate-700",
  };
  return map[status] || "bg-muted text-muted-foreground";
}

function fmt(d: string) {
  return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}
