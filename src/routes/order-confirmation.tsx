import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { CheckCircle2, Banknote, Package, MapPin, Phone, User, Loader2 } from "lucide-react";
import { OrderStatusTracker } from "@/components/OrderStatusTracker";

type Order = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  items: Array<{ name: string; price: number; qty: number }>;
};

export const Route = createFileRoute("/order-confirmation")({
  component: OrderConfirmationPage,
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: (search.orderId as string) || "",
  }),
  head: () => ({
    meta: [
      { title: "Order Confirmed — Shatakshi Herbal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function OrderConfirmationPage() {
  const { orderId } = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/" });
      return;
    }
    if (!orderId) {
      setError("No order specified");
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();
      if (error) setError(error.message);
      else if (!data) setError("Order not found");
      else setOrder(data as unknown as Order);
      setLoading(false);
    })();
  }, [orderId, user, authLoading, navigate]);

  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-cream py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {loading || authLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : error ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-border">
              <p className="text-destructive mb-4">{error}</p>
              <Link to="/shop" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold">Back to shop</Link>
            </div>
          ) : order ? (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 text-center border border-border shadow-sm">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/15 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-9 h-9 text-primary" />
                </div>
                <h1 className="font-display text-3xl mb-2">Order Confirmed!</h1>
                <p className="text-muted-foreground">Thank you for your order. We'll call you shortly to confirm.</p>
                <div className="mt-5 inline-block bg-accent/40 px-5 py-2 rounded-full">
                  <span className="text-xs text-muted-foreground">Order ID: </span>
                  <span className="font-mono font-semibold text-sm">{order.id}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Cash on Delivery</div>
                    <div className="text-xs text-muted-foreground">Pay ₹{order.total} in cash when your order arrives</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-border space-y-3">
                <h2 className="font-display text-xl flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" />Shipping Details</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2"><User className="w-4 h-4 text-muted-foreground mt-0.5" /><span>{order.shipping_name}</span></div>
                  <div className="flex items-start gap-2"><Phone className="w-4 h-4 text-muted-foreground mt-0.5" /><span>{order.shipping_phone}</span></div>
                  <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-muted-foreground mt-0.5" /><span>{order.shipping_address}</span></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-border">
                <h2 className="font-display text-xl flex items-center gap-2 mb-4"><Package className="w-5 h-5 text-primary" />Order Items</h2>
                <ul className="divide-y divide-border">
                  {(order.items || []).map((i, idx) => (
                    <li key={idx} className="py-3 flex justify-between text-sm">
                      <span>{i.name} <span className="text-muted-foreground">× {i.qty}</span></span>
                      <span className="font-semibold">₹{i.price * i.qty}</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-border mt-3 pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span><span>₹{order.total}</span>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Link to="/shop" className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:opacity-90 transition">Continue Shopping</Link>
                <Link to="/" className="border-2 border-primary text-primary px-6 py-3 rounded-full font-semibold hover:bg-primary hover:text-primary-foreground transition">Home</Link>
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}
