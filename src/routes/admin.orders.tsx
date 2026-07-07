import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { adminGet, adminPatch } from "@/lib/api-client";
import { Loader2, Search, RotateCcw, ChevronDown, FileDown, XCircle } from "lucide-react";
import { toast } from "sonner";
import { downloadInvoice } from "@/lib/invoice";
import CreateShipment from "@/components/CreateShipment";

export const Route = createFileRoute("/admin/orders")({
  component: OrdersPage,
});

type OrderItem = { name: string; qty: number; price: number };
type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  gst: number;
  total: number;
  email: string | null;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  trackingId: string | null;
  trackingStatus: string;
  awbNumber: string | null;
  courierName: string | null;
  shipmentStatus: string;
  labelUrl: string | null;
  createdAt: string;
  cancelReason: string | null;
};

const PAYMENT_STATUSES = ["created", "paid", "failed", "signature_failed", "refunded", "cod_pending", "cod_collected"];
const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "failed"];

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState(true);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("cancelled");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    setBusy(true);
    try {
      const data = await adminGet<{ orders: Order[] }>("/api/admin/orders");
      setOrders(data.orders || []);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (paymentFilter !== "all" && o.paymentStatus !== paymentFilter) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        (o.shippingPhone || "").toLowerCase().includes(q) ||
        (o.shippingName || "").toLowerCase().includes(q) ||
        (o.email || "").toLowerCase().includes(q)
      );
    });
  }, [orders, search, paymentFilter, statusFilter]);

  const updateOrder = async (id: string, patch: { status?: string; payment_status?: string }) => {
    setUpdating(id);
    try {
      await adminPatch(`/api/admin/orders?id=${id}`, patch);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, ...(patch.status ? { status: patch.status } : {}), ...(patch.payment_status ? { paymentStatus: patch.payment_status } : {}) }
            : o
        )
      );
      toast.success("Order updated");
    } catch {
      toast.error("Update failed");
    } finally {
      setUpdating(null);
    }
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

function OrderRow({ order, updating, onUpdate }: { order: Order; updating: boolean; onUpdate: (p: { status?: string; payment_status?: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [shipment, setShipment] = useState<{ awbNumber: string; courierName: string | null; labelUrl: string | null } | null>(null);

  const effectiveAwb = shipment?.awbNumber ?? order.awbNumber;
  const effectiveCourier = shipment?.courierName ?? order.courierName;
  const effectiveLabelUrl = shipment?.labelUrl ?? order.labelUrl;

  const isCancelled = order.status === "cancelled";

  return (
    <div className={`bg-card border rounded-xl overflow-hidden ${isCancelled ? "border-red-300 dark:border-red-700" : "border-border"}`}>
      <button onClick={() => setOpen((v) => !v)} className={`w-full flex flex-wrap items-center gap-3 p-4 text-left transition ${isCancelled ? "bg-red-50/60 dark:bg-red-950/20 hover:bg-red-100/60 dark:hover:bg-red-950/30" : "hover:bg-muted/30"}`}>
        <div className="flex-1 min-w-[180px]">
          <div className="font-semibold flex items-center gap-1.5">
            {isCancelled && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
            {order.shippingName || "—"}
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleString("en-IN")} • #{order.id.slice(0, 8)} • {order.shippingPhone || "—"}
          </div>
          {isCancelled && order.cancelReason && (
            <div className="text-xs text-red-600 dark:text-red-400 mt-0.5">
              Reason: {order.cancelReason}
            </div>
          )}
        </div>
        <div className="font-semibold whitespace-nowrap">₹{Number(order.total).toLocaleString("en-IN")}</div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${payBadge(order.paymentStatus)}`}>{order.paymentStatus}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(order.status)}`}>{order.status}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-border p-4 grid md:grid-cols-2 gap-6 bg-muted/20">
          {isCancelled && (
            <div className="md:col-span-2 flex items-start gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">Order cancelled by customer</span>
                {order.cancelReason && (
                  <p className="text-sm text-red-600 dark:text-red-300 mt-0.5">Reason: {order.cancelReason}</p>
                )}
              </div>
            </div>
          )}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Customer (admin only)</h4>
            <div className="text-sm space-y-1">
              <div><span className="text-muted-foreground">Email:</span> {order.email || "—"}</div>
              <div><span className="text-muted-foreground">Phone:</span> {order.shippingPhone || "—"}</div>
              <div className="pt-1"><span className="text-muted-foreground">Address:</span><div className="whitespace-pre-wrap mt-0.5">{order.shippingAddress || "—"}</div></div>
            </div>

            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2">Billing breakdown</h4>
            <div className="text-sm border border-border rounded-lg bg-card divide-y divide-border">
              <Row label="Subtotal" value={`₹${Number(order.subtotal).toLocaleString("en-IN")}`} />
              <Row label="Delivery" value={`₹${Number(order.deliveryCharge).toLocaleString("en-IN")}`} />
              {Number(order.discount) > 0 && <Row label="Discount" value={`−₹${Number(order.discount).toLocaleString("en-IN")}`} />}
              <Row label="Total" value={`₹${Number(order.total).toLocaleString("en-IN")}`} bold />
            </div>

            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2">Payment</h4>
            <div className="text-sm space-y-1">
              <div><span className="text-muted-foreground">Method:</span> {order.paymentMethod === "cod" ? "Cash on Delivery" : order.razorpayPaymentId ? "Online (Razorpay)" : "—"}</div>
              <div><span className="text-muted-foreground">Razorpay order:</span> <span className="font-mono text-xs">{order.razorpayOrderId || "—"}</span></div>
              <div><span className="text-muted-foreground">Payment ID:</span> <span className="font-mono text-xs">{order.razorpayPaymentId || "—"}</span></div>
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
            {/* Shipment */}
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-1">Shipment</h4>
            <CreateShipment
              orderId={order.id}
              awbNumber={effectiveAwb}
              courierName={effectiveCourier}
              shipmentStatus={order.shipmentStatus}
              trackingStatus={order.trackingStatus}
              trackingId={order.trackingId}
              labelUrl={effectiveLabelUrl}
              onCreated={(result) =>
                setShipment({
                  awbNumber: result.awbNumber,
                  courierName: result.courierName,
                  labelUrl: result.labelUrl,
                })
              }
            />

            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2">Manage</h4>
            <div className="flex flex-wrap gap-2 items-center">
              <label className="text-xs text-muted-foreground">Order:</label>
              <select disabled={updating} value={order.status} onChange={(e) => onUpdate({ status: e.target.value })} className="text-sm border border-border rounded-lg px-2 py-1.5 bg-background">
                {ORDER_STATUSES.map((s) => {
                  const packedOrBeyond = ["processing", "shipped", "delivered"].includes(order.status);
                  const disableCancel = s === "cancelled" && packedOrBeyond;
                  return <option key={s} value={s} disabled={disableCancel}>{s}{disableCancel ? " (not allowed)" : ""}</option>;
                })}
              </select>
              <label className="text-xs text-muted-foreground ml-2">Payment:</label>
              <select disabled={updating} value={order.paymentStatus} onChange={(e) => onUpdate({ payment_status: e.target.value })} className="text-sm border border-border rounded-lg px-2 py-1.5 bg-background">
                {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {updating && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
            </div>
            {/* Invoice download */}
            {(order.paymentStatus === "paid" || order.paymentStatus === "confirmed" || order.paymentMethod === "cod") && (
              <button
                onClick={() => downloadInvoice({
                  id: order.id,
                  shipping_name: order.shippingName,
                  shipping_phone: order.shippingPhone,
                  email: order.email,
                  shipping_address: order.shippingAddress,
                  items: order.items,
                  subtotal: order.subtotal,
                  gst: order.gst,
                  delivery_charge: order.deliveryCharge,
                  total: order.total,
                  payment_status: order.paymentStatus,
                  payment_method: order.paymentMethod,
                  razorpay_payment_id: order.razorpayPaymentId,
                  created_at: order.createdAt,
                })}
                className="mt-3 inline-flex items-center gap-2 border border-primary/40 text-primary bg-primary/5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/10 transition"
              >
                <FileDown className="w-3.5 h-3.5" /> Download Invoice
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between p-2.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
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
    cod_pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    cod_collected: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  };
  return map[s] || "bg-muted text-muted-foreground";
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    processing: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
    shipped: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
    delivered: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
    failed: "bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
  };
  return map[s] || "bg-muted text-muted-foreground";
}
