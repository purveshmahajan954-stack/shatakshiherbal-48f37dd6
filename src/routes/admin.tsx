import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LoginScreen } from "@/components/LoginScreen";
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

function AdminPage() {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const [gateChecked, setGateChecked] = useState(false);

  // Local admin gate: redirect to /admin-login if flag is missing
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("admin_auth") !== "true") {
      navigate({ to: "/admin-login", replace: true });
    } else {
      setGateChecked(true);
    }
  }, [navigate]);

  if (!gateChecked || loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Not signed in → show login screen (acts as the login redirect)
  if (!user) {
    return (
      <LoginScreen
        title="Admin sign in"
        subtitle="This area is restricted to administrators."
      />
    );
  }

  // Signed in but not admin → access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-24 text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-3xl mb-3">Access Restricted</h1>
          <p className="text-muted-foreground mb-2">
            You don't have permission to view the admin panel.
          </p>
          <p className="text-xs text-muted-foreground/80 mb-6">
            Signed in as: <span className="font-mono">{user?.email}</span>
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-medium"
          >
            Back home
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState(true);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    setBusy(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error("Failed to load orders");
    setOrders((data as Order[]) || []);
    setBusy(false);
  };

  useEffect(() => {
    load();
  }, []);

  // ---- Metrics ----
  const metrics = useMemo(() => {
    const paid = orders.filter((o) => o.payment_status === "paid");
    const revenue = paid.reduce((s, o) => s + Number(o.total || 0), 0);
    const pending = orders.filter((o) => o.payment_status === "created").length;
    const failed = orders.filter(
      (o) => o.payment_status === "failed" || o.payment_status === "signature_failed",
    ).length;
    const refunded = orders.filter((o) => o.payment_status === "refunded").length;
    const aov = paid.length ? revenue / paid.length : 0;
    return { revenue, paidCount: paid.length, pending, failed, refunded, aov, total: orders.length };
  }, [orders]);

  // ---- Filtering ----
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (paymentFilter !== "all" && o.payment_status !== paymentFilter) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        (o.shipping_name || "").toLowerCase().includes(q) ||
        (o.email || "").toLowerCase().includes(q) ||
        (o.shipping_phone || "").toLowerCase().includes(q) ||
        (o.razorpay_order_id || "").toLowerCase().includes(q) ||
        (o.razorpay_payment_id || "").toLowerCase().includes(q)
      );
    });
  }, [orders, search, paymentFilter, statusFilter]);

  const updateOrder = async (id: string, patch: Partial<Pick<Order, "status" | "payment_status">>) => {
    setUpdating(id);
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    setUpdating(null);
    if (error) {
      console.error(error);
      toast.error("Update failed. You may not have permission.");
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    toast.success("Order updated");
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="font-display text-3xl text-foreground">Admin Dashboard</h1>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-border rounded-lg hover:bg-muted/50"
          >
            <RotateCcw className="w-4 h-4" /> Refresh
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Manage orders, revenue, and customer details.
        </p>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <MetricCard
            icon={IndianRupee}
            label="Revenue (paid)"
            value={`₹${metrics.revenue.toLocaleString("en-IN")}`}
            tone="primary"
          />
          <MetricCard
            icon={CheckCircle2}
            label="Paid orders"
            value={String(metrics.paidCount)}
            tone="success"
          />
          <MetricCard
            icon={Clock}
            label="Pending"
            value={String(metrics.pending)}
            tone="muted"
          />
          <MetricCard
            icon={XCircle}
            label="Failed"
            value={String(metrics.failed)}
            tone="danger"
          />
          <MetricCard
            icon={TrendingUp}
            label="Avg. order value"
            value={`₹${Math.round(metrics.aov).toLocaleString("en-IN")}`}
            tone="muted"
          />
          <MetricCard
            icon={RotateCcw}
            label="Refunded"
            value={String(metrics.refunded)}
            tone="muted"
          />
          <MetricCard
            icon={ShoppingBag}
            label="All orders"
            value={String(metrics.total)}
            tone="muted"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-card p-4 mb-4 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, order or payment ID…"
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
                <option key={s} value={s}>
                  Payment: {s}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-2 bg-cream/50"
            >
              <option value="all">All statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  Status: {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Orders */}
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
      </main>
      <Footer />
    </div>
  );
}

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
          <div className="font-semibold text-foreground">
            {order.shipping_name || "—"}
          </div>
          <div className="text-xs text-muted-foreground">
            {fmt(order.created_at)} • #{order.id.slice(0, 8)}
          </div>
        </div>
        <div className="text-sm text-muted-foreground hidden md:block">
          {order.email || "—"}
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
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-border p-4 grid md:grid-cols-2 gap-6 bg-cream/30">
          {/* Customer + shipping */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Customer
            </h4>
            <div className="text-sm space-y-1">
              <div><span className="text-muted-foreground">Name:</span> {order.shipping_name || "—"}</div>
              <div><span className="text-muted-foreground">Email:</span> {order.email || "—"}</div>
              <div><span className="text-muted-foreground">Phone:</span> {order.shipping_phone || "—"}</div>
              <div className="pt-1">
                <span className="text-muted-foreground">Address:</span>
                <div className="whitespace-pre-wrap mt-0.5">{order.shipping_address || "—"}</div>
              </div>
            </div>

            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2">
              Payment IDs
            </h4>
            <div className="text-xs font-mono space-y-1 break-all">
              <div>Order: {order.razorpay_order_id || "—"}</div>
              <div>Payment: {order.razorpay_payment_id || "—"}</div>
            </div>
          </div>

          {/* Items + totals + management */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Items
            </h4>
            <ul className="text-sm divide-y divide-border border border-border rounded-lg bg-white">
              {(order.items || []).map((it, i) => (
                <li key={i} className="flex justify-between gap-3 p-2.5">
                  <span className="flex-1">{it.name} <span className="text-muted-foreground">×{it.qty}</span></span>
                  <span className="whitespace-nowrap">₹{(Number(it.price) * it.qty).toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>

            <div className="text-sm mt-3 space-y-1">
              <Row label="Subtotal" value={`₹${Number(order.subtotal).toLocaleString("en-IN")}`} />
              {Number(order.discount) > 0 && (
                <Row label={`Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}`} value={`-₹${Number(order.discount).toLocaleString("en-IN")}`} />
              )}
              <Row label="Delivery" value={`₹${Number(order.delivery_charge).toLocaleString("en-IN")}`} />
              <Row label="GST" value={`₹${Number(order.gst).toLocaleString("en-IN")}`} />
              <Row label="Total" value={`₹${Number(order.total).toLocaleString("en-IN")}`} bold />
            </div>

            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2">
              Manage
            </h4>
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

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold pt-1 border-t border-border" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className={bold ? "text-foreground" : ""}>{value}</span>
    </div>
  );
}
