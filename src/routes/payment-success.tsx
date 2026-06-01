import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { CheckCircle2, Package, ArrowRight, Truck, Copy } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getMyOrder } from "@/lib/payments.functions";

export const Route = createFileRoute("/payment-success")({
  validateSearch: z.object({ o: z.string().uuid().optional() }),
  head: () => ({
    meta: [
      { title: "Payment Successful — Shatakshi Herbal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { o } = Route.useSearch();
  const fetchOrder = useServerFn(getMyOrder);
  const { data } = useQuery({
    queryKey: ["order", o],
    queryFn: () => fetchOrder({ data: { id: o! } }),
    enabled: !!o,
  });
  const order = data?.order;

  return (
    <div className="min-h-screen flex flex-col bg-cream/40">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-16">
        <div className="bg-white rounded-2xl shadow-card p-8 sm:p-12 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-5 animate-in zoom-in duration-500">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl mb-2">Order Placed Successfully</h1>
          <p className="text-muted-foreground mb-8">Thank you for your order. A confirmation email is on its way.</p>

          {order && (
            <>
              {order.tracking_id && (
                <div className="bg-primary/5 border-2 border-dashed border-primary/30 rounded-xl p-5 mb-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Your Tracking ID</div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-2xl font-bold text-primary">{order.tracking_id}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(order.tracking_id!);
                        toast.success("Tracking ID copied");
                      }}
                      className="p-1.5 rounded hover:bg-primary/10"
                      aria-label="Copy tracking ID"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              )}
              <div className="text-left bg-cream/50 rounded-xl p-5 space-y-2 text-sm border border-border">
                <div className="flex justify-between"><span className="text-muted-foreground">Order ID</span><span className="font-mono">#{order.id.slice(0, 8).toUpperCase()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">₹{order.total}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment ID</span><span className="font-mono text-xs">{order.razorpay_payment_id}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="text-primary font-semibold capitalize">{order.payment_status}</span></div>
              </div>
            </>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            {order?.tracking_id && (
              <Link
                to="/track/$trackingId"
                params={{ trackingId: order.tracking_id }}
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:opacity-90"
              >
                <Truck className="w-4 h-4" /> Track Order
              </Link>
            )}
            <Link to="/orders" className="inline-flex items-center justify-center gap-2 border border-border px-6 py-3 rounded-full font-semibold hover:bg-cream">
              <Package className="w-4 h-4" /> My Orders
            </Link>
            <Link to="/shop" className="inline-flex items-center justify-center gap-2 border border-border px-6 py-3 rounded-full font-semibold hover:bg-cream">
              Continue Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
