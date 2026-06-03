import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { LoginScreen } from "@/components/LoginScreen";
import { Loader2, Package, ShoppingBag, Check, CircleDashed, XCircle, Copy, Truck } from "lucide-react";
import { toast } from "sonner";

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
};

function OrdersPage() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/user/orders", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Could not load orders");
      return res.json();
    },
    enabled: !!user,
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!user) return <LoginScreen />;

  const orders = data?.orders ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-cream/40">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10">
        <h1 className="font-display text-3xl sm:text-4xl mb-2">My Orders</h1>
        <p className="text-sm text-muted-foreground mb-8">Your purchase history and payment status</p>

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
              return (
                <li key={o.id} className="bg-white rounded-2xl shadow-card p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-border">
                    <div>
                      <div className="text-xs text-muted-foreground">Order ID</div>
                      <div className="font-mono font-semibold">#{o.id.slice(0, 8).toUpperCase()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Placed on</div>
                      <div className="text-sm">{new Date(o.created_at ?? o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total</div>
                      <div className="font-semibold">₹{o.total}</div>
                    </div>
                    <div>
                      <span className={`inline-block text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${STATUS_STYLES[o.payment_status ?? o.paymentStatus] ?? "bg-muted"}`}>
                        {o.payment_status ?? o.paymentStatus}
                      </span>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {items.map((i: any, idx: number) => (
                      <li key={idx} className="flex items-center gap-3 text-sm">
                        {i.image && <img src={i.image} alt={i.name} className="w-10 h-10 rounded-md object-cover bg-accent/30" />}
                        <span className="flex-1 truncate">{i.name}</span>
                        <span className="text-muted-foreground">× {i.qty}</span>
                        <span className="w-20 text-right font-medium">₹{i.price * i.qty}</span>
                      </li>
                    ))}
                  </ul>

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
                        const line = step.state === "done" ? "bg-primary" : step.state === "failed" ? "bg-destructive" : "bg-border";
                        return (
                          <li key={step.key} className="flex-1 flex flex-col items-center text-center">
                            <div className="flex items-center w-full">
                              <div className="flex-1 h-0.5 bg-transparent" />
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${dot}`}>
                                {step.state === "failed" ? <XCircle className="w-4 h-4" /> : step.state === "done" ? <Check className="w-4 h-4" /> : <CircleDashed className="w-4 h-4" />}
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

                  {((o.razorpay_order_id ?? o.razorpayOrderId) || (o.razorpay_payment_id ?? o.razorpayPaymentId)) && (
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-cream/50 rounded-lg p-3 border border-border">
                      {(o.razorpay_order_id ?? o.razorpayOrderId) && (
                        <button type="button" onClick={() => copy(o.razorpay_order_id ?? o.razorpayOrderId, "Razorpay Order ID")} className="flex items-center justify-between gap-2 text-left hover:bg-white rounded px-2 py-1.5 transition">
                          <span><span className="text-muted-foreground">Razorpay Order: </span><span className="font-mono">{o.razorpay_order_id ?? o.razorpayOrderId}</span></span>
                          <Copy className="w-3 h-3 text-muted-foreground shrink-0" />
                        </button>
                      )}
                      {(o.razorpay_payment_id ?? o.razorpayPaymentId) && (
                        <button type="button" onClick={() => copy(o.razorpay_payment_id ?? o.razorpayPaymentId, "Payment ID")} className="flex items-center justify-between gap-2 text-left hover:bg-white rounded px-2 py-1.5 transition">
                          <span><span className="text-muted-foreground">Payment ID: </span><span className="font-mono">{o.razorpay_payment_id ?? o.razorpayPaymentId}</span></span>
                          <Copy className="w-3 h-3 text-muted-foreground shrink-0" />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap justify-end gap-3">
                    {(o.tracking_id ?? o.trackingId) && (
                      <Link to="/track/$trackingId" params={{ trackingId: o.tracking_id ?? o.trackingId }} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold hover:opacity-90">
                        <Truck className="w-4 h-4" /> Track Order
                      </Link>
                    )}
                    {(o.payment_status ?? o.paymentStatus) !== "paid" && (o.payment_status ?? o.paymentStatus) !== "confirmed" && (
                      <Link to="/checkout" className="inline-block text-sm text-primary font-semibold hover:underline self-center">Retry payment →</Link>
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
