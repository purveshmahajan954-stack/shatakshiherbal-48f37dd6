import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { LoginScreen } from "@/components/LoginScreen";
import { getMyOrders } from "@/lib/payments.functions";
import { Loader2, Package, ShoppingBag } from "lucide-react";

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
  const fetchOrders = useServerFn(getMyOrders);
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => fetchOrders(),
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
                      <div className="text-sm">{new Date(o.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total</div>
                      <div className="font-semibold">₹{o.total}</div>
                    </div>
                    <div>
                      <span className={`inline-block text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${STATUS_STYLES[o.payment_status] ?? "bg-muted"}`}>
                        {o.payment_status}
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
                  {o.payment_status !== "paid" && o.payment_status !== "confirmed" && (
                    <div className="mt-4 text-right">
                      <Link to="/checkout" className="inline-block text-sm text-primary font-semibold hover:underline">Retry payment →</Link>
                    </div>
                  )}
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
