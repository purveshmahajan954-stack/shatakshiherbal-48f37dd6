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
          <h1 className="font-display text-3xl sm:text-4xl mb-2">Payment Successful</h1>
          <p className="text-muted-foreground mb-8">Thank you for your order. A confirmation email is on its way.</p>

          {order && (
            <div className="text-left bg-cream/50 rounded-xl p-5 space-y-2 text-sm border border-border">
              <div className="flex justify-between"><span className="text-muted-foreground">Order ID</span><span className="font-mono">#{order.id.slice(0, 8).toUpperCase()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">₹{order.total}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Payment ID</span><span className="font-mono text-xs">{order.razorpay_payment_id}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="text-primary font-semibold capitalize">{order.payment_status}</span></div>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/orders" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:opacity-90">
              <Package className="w-4 h-4" /> View My Orders
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
