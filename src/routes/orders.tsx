import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { LoginScreen } from "@/components/LoginScreen";
import { getMyOrders } from "@/lib/payments.functions";
import { useCart } from "@/lib/cart";
import { fetchProductsFromDb } from "@/lib/use-products";
import {
  Loader2, Package, ShoppingBag, Check, CircleDashed, XCircle,
  Copy, Truck, FileDown, MapPin, RefreshCcw, X, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { downloadInvoice } from "@/lib/invoice";
import { CANCEL_WINDOW_HOURS } from "@/lib/order-constants";

type TimelineStep = { key: string; label: string; state: "done" | "current" | "todo" | "failed" };

function buildTimeline(paymentStatus: string): TimelineStep[] {
  const failed = paymentStatus === "failed" || paymentStatus === "signature_failed";
  const paid = paymentStatus === "paid";
  return [
    { key: "created", label: "Order Created", state: "done" },
    { key: "paid", label: "Payment Received", state: paid ? "done" : failed ? "todo" : "current" },
    { key: failed ? "failed" : "fulfilled", label: failed ? "Payment Failed" : "Confirmed & Fulfilled", state: failed ? "failed" : paid ? "done" : "todo" },
  ];
}

function copy(text: string, label: string) {
  navigator.clipboard?.writeText(text).then(() => toast.success(`${label} copied`));
}

/** Returns hours remaining in the cancel window, or null if outside window */
function cancelWindowHoursLeft(createdAt: string): number | null {
  const elapsed = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  const remaining = CANCEL_WINDOW_HOURS - elapsed;
  return remaining > 0 ? remaining : null;
}

const NON_CANCELLABLE_STATUS = new Set(["shipped", "delivered", "cancelled", "failed"]);
// Tracking statuses that mean the courier already has the parcel — no cancellation possible
const NON_CANCELLABLE_TRACKING = new Set([
  "Shipped", "In Transit", "Out for Delivery", "Delivered", "RTO", "Returned",
]);

function isCancellable(order: any): boolean {
  const status = order.status ?? "";
  const shipmentStatus = order.shipment_status ?? order.shipmentStatus ?? "Not Created";
  const trackingStatus = order.tracking_status ?? order.trackingStatus ?? "";
  const paymentMethod = order.payment_method ?? order.paymentMethod ?? "";
  const createdAt = order.created_at ?? order.createdAt ?? "";

  if (NON_CANCELLABLE_STATUS.has(status)) return false;
  if (NON_CANCELLABLE_TRACKING.has(trackingStatus)) return false;
  if (!createdAt) return false;
  if (cancelWindowHoursLeft(createdAt) === null) return false;

  // Prepaid: block if shipment already dispatched to courier
  if (paymentMethod !== "cod" && shipmentStatus === "Created") return false;

  // COD: allow cancel as long as tracking is not in transit (checked above)
  return true;
}

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — Shatakshi Herbal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrdersPage,
});

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-primary/10 text-primary",
  confirmed: "bg-primary/10 text-primary",
  pending: "bg-gold/15 text-gold",
  created: "bg-muted text-muted-foreground",
  failed: "bg-destructive/10 text-destructive",
  signature_failed: "bg-destructive/10 text-destructive",
  refunded: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

const TRACK_BADGE: Record<string, string> = {
  "Order Placed": "bg-muted text-muted-foreground",
  Packed: "bg-yellow-100 text-yellow-700",
  Shipped: "bg-blue-100 text-blue-700",
  "In Transit": "bg-indigo-100 text-indigo-700",
  "Out for Delivery": "bg-orange-100 text-orange-700",
  Delivered: "bg-emerald-100 text-emerald-700",
  RTO: "bg-red-100 text-red-700",
  Returned: "bg-red-100 text-red-700",
  Cancelled: "bg-red-100 text-red-700",
};

function CancelConfirmDialog({
  order,
  onConfirm,
  onClose,
  loading,
}: {
  order: any;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  const isPaid =
    order.payment_status === "paid" ||
    order.paymentStatus === "paid" ||
    order.payment_status === "confirmed" ||
    order.paymentStatus === "confirmed";
  const isCod =
    order.payment_method === "cod" || order.paymentMethod === "cod";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Cancel this order?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Order #{(order.id ?? "").slice(0, 8).toUpperCase()} — ₹{order.total}
            </p>
          </div>
        </div>

        {isPaid && !isCod ? (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-800 mb-5">
            ✅ Your <strong>refund will be processed automatically</strong> to your original payment method. Usually takes 5–7 business days.
          </div>
        ) : isCod ? (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-800 mb-5">
            This is a Cash on Delivery order — no payment was collected, so no refund is needed.
          </div>
        ) : (
          <div className="bg-muted/50 rounded-xl p-3 text-sm text-muted-foreground mb-5">
            No payment was made for this order, so no refund will be issued.
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-5">
          This action cannot be undone once confirmed.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-full text-sm font-semibold border border-border hover:bg-accent transition"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-full text-sm font-semibold bg-destructive text-destructive-foreground hover:opacity-90 transition flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            Yes, Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
}

function OrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { clear, add } = useCart();
  const queryClient = useQueryClient();
  const fetchOrders = useServerFn(getMyOrders);
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => fetchOrders(),
    enabled: !!user,
    staleTime: 60_000,
  });

  const [dbImages, setDbImages] = useState<Record<string, string>>({});
  useEffect(() => {
    fetchProductsFromDb().then((list) => {
      const map: Record<string, string> = {};
      list.forEach((p) => { if (p.slug && p.image) map[p.slug] = p.image; });
      setDbImages(map);
    }).catch(() => {});
  }, []);

  // Cancel dialog state
  const [cancellingOrder, setCancellingOrder] = useState<any | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const handleCancelConfirm = async () => {
    if (!cancellingOrder) return;
    setCancelLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ orderId: cancellingOrder.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Cancel nahi hua, dobara try karo");
        return;
      }

      // Check refund status
      if (data.refund?.ok) {
        toast.success("Order cancel hua! Refund 5–7 business days mein aa jayega.");
      } else if (data.refund && !data.refund.ok) {
        toast.success("Order cancel hua! Refund ke liye support se contact karo.");
      } else {
        toast.success("Order cancel ho gaya!");
      }

      // Refresh orders list
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      setCancellingOrder(null);
    } catch {
      toast.error("Network error — dobara try karo");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReorder = (order: any) => {
    const items = Array.isArray(order.items) ? order.items : [];
    if (items.length === 0) { toast.error("No items found in this order"); return; }

    clear();
    items.forEach((i: any) => {
      add({ name: i.name, price: i.price, image: i.image, slug: i.slug }, i.qty ?? 1);
    });

    try {
      const shipping = order.shipping_address ?? order.shippingAddress ?? "";
      const parts = typeof shipping === "string" ? shipping.split(",").map((s: string) => s.trim()) : [];
      const prefill: Record<string, string> = {
        name: order.shipping_name ?? order.shippingName ?? user?.fullName ?? "",
        phone: order.shipping_phone ?? order.shippingPhone ?? user?.phone ?? "",
        email: order.shipping_email ?? order.shippingEmail ?? user?.email ?? "",
      };
      if (parts.length >= 4) {
        prefill.flatHouse = parts[0] ?? "";
        prefill.areaStreet = parts[1] ?? "";
        prefill.landmark = parts.length > 5 ? parts[2] ?? "" : "";
        const offset = parts.length > 5 ? 1 : 0;
        prefill.district = parts[2 + offset] ?? "";
        prefill.city = parts[3 + offset] ?? "";
        prefill.state = parts[4 + offset] ?? "";
        prefill.pincode = parts[parts.length - 1]?.replace(/\D/g, "").slice(0, 6) ?? "";
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("reorder_prefill", JSON.stringify(prefill));
      }
    } catch {}

    toast.success("Items added to cart! Redirecting to checkout…");
    navigate({ to: "/checkout" });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!user) return <LoginScreen />;

  const orders = data?.orders ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-cream/40">
      {cancellingOrder && (
        <CancelConfirmDialog
          order={cancellingOrder}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancellingOrder(null)}
          loading={cancelLoading}
        />
      )}

      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10">
        <h1 className="font-display text-3xl sm:text-4xl mb-2">My Orders</h1>
        <p className="text-sm text-muted-foreground mb-8">Your purchase history and shipment tracking</p>

        {isLoading ? (
          <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-card">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground mb-6">You haven't placed any orders yet.</p>
            <Link to="/shop" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold">
              <ShoppingBag className="w-4 h-4" /> Start Shopping
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {orders.map((o: any) => {
              const items = Array.isArray(o.items) ? o.items : [];
              const trackingStatus = o.tracking_status ?? o.trackingStatus;
              const awbNumber = o.awb_number ?? o.awbNumber;
              const courierName = o.courier_name ?? o.courierName;
              const trackingId = o.tracking_id ?? o.trackingId;
              const createdAt = o.created_at ?? o.createdAt ?? "";
              const hoursLeft = createdAt ? cancelWindowHoursLeft(createdAt) : null;
              const canCancel = isCancellable(o);
              const isCancelled = o.status === "cancelled" || o.payment_status === "refunded" || o.paymentStatus === "refunded";

              return (
                <li key={o.id} className="bg-white rounded-2xl shadow-card p-5 sm:p-6">
                  {/* Order header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-border">
                    <div>
                      <div className="text-xs text-muted-foreground">Order ID</div>
                      <div className="font-mono font-semibold">#{o.id.slice(0, 8).toUpperCase()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Placed on</div>
                      <div className="text-sm">{new Date(createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total</div>
                      <div className="font-semibold">₹{o.total}</div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className={`inline-block text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${STATUS_STYLES[o.payment_status ?? o.paymentStatus] ?? "bg-muted"}`}>
                        {o.payment_status ?? o.paymentStatus}
                      </span>
                      {isCancelled && (o.status === "cancelled") && (
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          Cancelled
                        </span>
                      )}
                      {trackingStatus && trackingStatus !== "Order Placed" && o.status !== "cancelled" && (
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${TRACK_BADGE[trackingStatus] ?? "bg-muted text-muted-foreground"}`}>
                          {trackingStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <ul className="mt-4 space-y-2">
                    {items.map((i: any, idx: number) => (
                      <li key={idx} className="flex items-center gap-3 text-sm">
                        {(dbImages[i.slug] || i.image) && <img src={dbImages[i.slug] || i.image} alt={i.name} className="w-10 h-10 rounded-md object-cover bg-accent/30" />}
                        <span className="flex-1 truncate">{i.name}</span>
                        <span className="text-muted-foreground">× {i.qty}</span>
                        <span className="w-20 text-right font-medium">₹{i.price * i.qty}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Shipment info bar */}
                  {awbNumber && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 text-sm">
                      <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-blue-700 dark:text-blue-300">{courierName ?? "Courier"}</span>
                        <span className="text-blue-600/70 dark:text-blue-400 mx-2">·</span>
                        <span className="text-xs font-mono text-blue-700 dark:text-blue-300">{awbNumber}</span>
                      </div>
                      {trackingStatus && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TRACK_BADGE[trackingStatus] ?? "bg-muted text-muted-foreground"}`}>
                          {trackingStatus}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Cancel window warning */}
                  {canCancel && hoursLeft !== null && hoursLeft < 6 && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Cancel window closes in {Math.ceil(hoursLeft)} hour{Math.ceil(hoursLeft) !== 1 ? "s" : ""}
                    </div>
                  )}

                  {/* Status timeline */}
                  <div className="mt-6 pt-5 border-t border-border">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Order Status</div>
                    <ol className="flex items-start gap-2 sm:gap-3">
                      {buildTimeline(o.payment_status ?? o.paymentStatus).map((step, idx, arr) => {
                        const isLast = idx === arr.length - 1;
                        const dot =
                          step.state === "failed" ? "bg-destructive text-destructive-foreground"
                          : step.state === "done" ? "bg-primary text-primary-foreground"
                          : step.state === "current" ? "bg-gold text-white animate-pulse"
                          : "bg-muted text-muted-foreground";
                        const line =
                          step.state === "done" ? "bg-primary"
                          : step.state === "failed" ? "bg-destructive"
                          : "bg-border";
                        return (
                          <li key={step.key} className="flex-1 flex flex-col items-center text-center">
                            <div className="flex items-center w-full">
                              <div className="flex-1 h-0.5 bg-transparent" />
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${dot}`}>
                                {step.state === "failed" ? <XCircle className="w-4 h-4" />
                                  : step.state === "done" ? <Check className="w-4 h-4" />
                                  : <CircleDashed className="w-4 h-4" />}
                              </div>
                              <div className={`flex-1 h-0.5 ${isLast ? "bg-transparent" : line}`} />
                            </div>
                            <div className={`mt-2 text-[11px] sm:text-xs font-medium ${step.state === "todo" ? "text-muted-foreground" : ""}`}>
                              {step.label}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>

                  {/* Razorpay IDs */}
                  {(o.razorpay_order_id || o.razorpayOrderId) && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-cream/50 rounded-lg p-3 border border-border">
                      {(o.razorpay_order_id ?? o.razorpayOrderId) && (
                        <button type="button" onClick={() => copy(o.razorpay_order_id ?? o.razorpayOrderId, "Razorpay Order ID")}
                          className="flex items-center justify-between gap-2 text-left hover:bg-white rounded px-2 py-1.5 transition">
                          <span>
                            <span className="text-muted-foreground">Razorpay Order: </span>
                            <span className="font-mono">{o.razorpay_order_id ?? o.razorpayOrderId}</span>
                          </span>
                          <Copy className="w-3 h-3 text-muted-foreground shrink-0" />
                        </button>
                      )}
                      {(o.razorpay_payment_id ?? o.razorpayPaymentId) && (
                        <button type="button" onClick={() => copy(o.razorpay_payment_id ?? o.razorpayPaymentId, "Payment ID")}
                          className="flex items-center justify-between gap-2 text-left hover:bg-white rounded px-2 py-1.5 transition">
                          <span>
                            <span className="text-muted-foreground">Payment ID: </span>
                            <span className="font-mono">{o.razorpay_payment_id ?? o.razorpayPaymentId}</span>
                          </span>
                          <Copy className="w-3 h-3 text-muted-foreground shrink-0" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="mt-4 flex flex-wrap justify-end gap-3">
                    {/* Cancel button */}
                    {canCancel && (
                      <button
                        onClick={() => setCancellingOrder(o)}
                        className="inline-flex items-center gap-2 border border-destructive/40 text-destructive bg-destructive/5 px-4 py-2 rounded-full text-sm font-semibold hover:bg-destructive/10 transition"
                      >
                        <X className="w-4 h-4" /> Cancel Order
                      </button>
                    )}

                    {(o.payment_status === "paid" || o.payment_status === "confirmed" || o.paymentStatus === "paid" || o.paymentStatus === "confirmed") && o.status !== "cancelled" && (
                      <>
                        <button
                          onClick={() => downloadInvoice(o)}
                          className="inline-flex items-center gap-2 border border-primary/40 text-primary bg-primary/5 px-4 py-2 rounded-full text-sm font-semibold hover:bg-primary/10 transition"
                        >
                          <FileDown className="w-4 h-4" /> Invoice
                        </button>
                        <button
                          onClick={() => handleReorder(o)}
                          className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/30 px-4 py-2 rounded-full text-sm font-semibold hover:bg-primary/20 transition"
                        >
                          <RefreshCcw className="w-4 h-4" /> Reorder
                        </button>
                      </>
                    )}
                    {trackingId && o.status !== "cancelled" && (
                      <Link
                        to="/track/$trackingId"
                        params={{ trackingId }}
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition"
                      >
                        <MapPin className="w-4 h-4" /> Track Package
                      </Link>
                    )}
                    {(o.payment_status !== "paid" && o.payment_status !== "confirmed" && o.paymentStatus !== "paid" && o.paymentStatus !== "confirmed") && o.status !== "cancelled" && o.payment_method !== "cod" && o.paymentMethod !== "cod" && (
                      <Link to="/checkout" className="inline-block text-sm text-primary font-semibold hover:underline self-center">
                        Retry payment →
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
