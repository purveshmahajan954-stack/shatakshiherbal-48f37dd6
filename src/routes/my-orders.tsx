import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Loader2, Package, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/my-orders")({
  component: MyOrdersPage,
  head: () => ({ meta: [{ title: "My Orders — Shatakshi Herbal" }] }),
});

type Order = {
  id: string;
  items: any;
  total: number;
  status: string;
  created_at: string;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function MyOrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!user) { setBusy(false); return; }
    supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setOrders((data as Order[]) || []); setBusy(false); });
  }, [user]);

  if (loading) {
    return <div className="min-h-screen bg-cream flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Package className="w-6 h-6 text-primary" />
          <h1 className="font-display text-3xl text-foreground">My Orders</h1>
        </div>

        {!user ? (
          <div className="bg-white rounded-xl shadow-card p-12 text-center">
            <p className="text-muted-foreground mb-4">Please sign in to view your orders.</p>
          </div>
        ) : busy ? (
          <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-card p-12 text-center">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground mb-6">You haven't placed any orders yet.</p>
            <Link to="/shop" className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <Link
                key={o.id}
                to="/order-confirmation"
                search={{ orderId: o.id }}
                className="block bg-white rounded-xl shadow-card p-5 hover:shadow-lg transition"
              >
                <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Order #{o.id.slice(0, 8).toUpperCase()}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{new Date(o.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${STATUS_COLORS[o.status] || "bg-muted text-foreground"}`}>{o.status}</span>
                </div>
                <div className="text-sm text-foreground/80 mb-2">
                  {Array.isArray(o.items) ? o.items.map((i: any) => `${i.name} ×${i.qty}`).join(", ") : "—"}
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Cash on Delivery</span>
                  <span className="font-bold text-lg">₹{Number(o.total).toLocaleString("en-IN")}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
