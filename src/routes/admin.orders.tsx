import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, RotateCcw, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({
  component: OrdersPage,
});

type OrderItem = { name: string; qty: number; price: number };
type Order = {
  id: string;
  user_id: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  delivery_charge: number;
  gst: number;
  total: number;
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

const PAYMENT_STATUSES = ["created", "paid", "failed", "signature_failed", "refunded"];
const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "failed"];

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState(true);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    setBusy(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) toast.error("Failed to load orders");
    setOrders((data as unknown as Order[]) || []);
    setBusy(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (paymentFilter !== "all" && o.payment_status !== paymentFilter) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        (o.shipping_phone || "").toLowerCase().includes(q) ||
        (o.shipping_name || "").toLowerCase().includes(q) ||
        (o.email || "").toLowerCase().includes(q)
      );
    });
  }, [orders, search, paymentFilter, statusFilter]);

  const updateOrder = async (id: string, patch: Partial<Pick<Order, "status" | "payment_status">>) => {
    setUpdating(id);
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    setUpdating(null);
    if (error) {
      toast.error("Update failed");
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    toast.success("Order updated");
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by phone, order ID, name, email…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="text-sm border border-border rounded-lg px-3 py-2 bg-background">
            <option value="all">All payments</option>
            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>Payment: {s}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-border rounded-lg px-3 py-2 bg-background">
            <option value="all">All statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>Status: {s}</option>)}
          </select>
          <button onClick={load} className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-background border border-border rounded-lg hover:bg-muted">
            <RotateCcw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {busy ? (
        <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center text-muted-foreground text-sm">
          No orders match your filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <OrderRow key={o.id} order={o} updating={updating === o.id} onUpdate={(patch) => updateOrder(o.id, patch)} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderRow({ order, updating, onUpdate }: { order: Order; updating: boolean; onUpdate: (p: Partial<Pick<Order, "status" | "payment_status">>) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex flex-wrap items-center gap-3 p-4 text-left hover:bg-muted/30 transition">
        <div className="flex-1 min-w-[180px]">
          <div className="font-semibold">{order.shipping_name || "—"}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleString("en-IN")} • #{order.id.slice(0, 8)} • {order.shipping_phone || "—"}
          </div>
        </div>
        <div className="font-semibold whitespace-nowrap">₹{Number(order.total).toLocaleString("en-IN")}</div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${payBadge(order.payment_status)}`}>{order.payment_status}</span>
        <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{order.status}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-border p-4 grid md:grid-cols-2 gap-6 bg-muted/20">
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Customer (admin only)</h4>
            <div className="text-sm space-y-1">
              <div><span className="text-muted-foreground">Email:</span> {order.email || "—"}</div>
              <div><span className="text-muted-foreground">Phone:</span> {order.shipping_phone || "—"}</div>
              <div className="pt-1"><span className="text-muted-foreground">Address:</span><div className="whitespace-pre-wrap mt-0.5">{order.shipping_address || "—"}</div></div>
            </div>

            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2">Billing breakdown</h4>
            <div className="text-sm border border-border rounded-lg bg-card divide-y divide-border">
              <Row label="Base amount" value={`₹${Number(order.subtotal).toLocaleString("en-IN")}`} />
              <Row label="GST (5%)" value={`₹${Number(order.gst).toLocaleString("en-IN")}`} accent />
              <Row label="Delivery" value={`₹${Number(order.delivery_charge).toLocaleString("en-IN")}`} />
              {Number(order.discount) > 0 && <Row label="Discount" value={`−₹${Number(order.discount).toLocaleString("en-IN")}`} />}
              <Row label="Total bill" value={`₹${Number(order.total).toLocaleString("en-IN")}`} bold />
            </div>

            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2">Payment</h4>
            <div className="text-sm space-y-1">
              <div><span className="text-muted-foreground">Method:</span> {order.razorpay_payment_id ? "Online (Razorpay)" : "—"}</div>
              <div><span className="text-muted-foreground">Razorpay order:</span> <span className="font-mono text-xs">{order.razorpay_order_id || "—"}</span></div>
              <div><span className="text-muted-foreground">Payment ID:</span> <span className="font-mono text-xs">{order.razorpay_payment_id || "—"}</span></div>
            </div>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Items</h4>
            <ul className="text-sm divide-y divide-border border border-border rounded-lg bg-card">
              {(order.items || []).map((it, i) => (
                <li key={i} className="flex justify-between gap-3 p-2.5">
                  <span className="flex-1">{it.name} <span className="text-muted-foreground">×{it.qty}</span></span>
                  <span className="whitespace-nowrap">₹{(Number(it.price) * it.qty).toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2">Manage</h4>
            <div className="flex flex-wrap gap-2 items-center">
              <label className="text-xs text-muted-foreground">Order:</label>
              <select disabled={updating} value={order.status} onChange={(e) => onUpdate({ status: e.target.value })} className="text-sm border border-border rounded-lg px-2 py-1.5 bg-background">
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <label className="text-xs text-muted-foreground ml-2">Payment:</label>
              <select disabled={updating} value={order.payment_status} onChange={(e) => onUpdate({ payment_status: e.target.value })} className="text-sm border border-border rounded-lg px-2 py-1.5 bg-background">
                {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {updating && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between p-2.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${bold ? "font-semibold" : ""} ${accent ? "text-primary" : ""}`}>{value}</span>
    </div>
  );
}

function payBadge(s: string) {
  const map: Record<string, string> = {
    paid: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
    created: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    failed: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
    signature_failed: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
    refunded: "bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
  };
  return map[s] || "bg-muted text-muted-foreground";
}
