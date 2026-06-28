import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth.tsx";
import { LoginScreen } from "@/components/LoginScreen";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2, Package, User, Heart, Truck, ShoppingBag,
  ChevronRight, LayoutDashboard, MapPin, FileDown,
} from "lucide-react";
import { downloadInvoice } from "@/lib/invoice";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Shatakshi Herbal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

const STATUS_STYLES: Record<string, { bg: string; label: string }> = {
  paid:             { bg: "bg-emerald-100 text-emerald-700", label: "Paid" },
  confirmed:        { bg: "bg-emerald-100 text-emerald-700", label: "Confirmed" },
  pending:          { bg: "bg-yellow-100 text-yellow-700",   label: "Pending" },
  created:          { bg: "bg-muted text-muted-foreground",  label: "Processing" },
  failed:           { bg: "bg-red-100 text-red-700",         label: "Failed" },
  signature_failed: { bg: "bg-red-100 text-red-700",         label: "Failed" },
};

const TRACK_BADGE: Record<string, string> = {
  "Order Placed":    "bg-muted text-muted-foreground",
  Packed:            "bg-yellow-100 text-yellow-700",
  Shipped:           "bg-blue-100 text-blue-700",
  "In Transit":      "bg-indigo-100 text-indigo-700",
  "Out for Delivery":"bg-orange-100 text-orange-700",
  Delivered:         "bg-emerald-100 text-emerald-700",
  RTO:               "bg-red-100 text-red-700",
  Returned:          "bg-red-100 text-red-700",
  Cancelled:         "bg-red-100 text-red-700",
};

function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  async function fetchOrders() {
    setOrdersLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/user/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch {
      toast.error("Could not load orders");
    } finally {
      setOrdersLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <LoginScreen title="Sign in to your dashboard" subtitle="View orders, manage profile and more" />;

  const recentOrders = orders.slice(0, 3);
  const paidOrders = orders.filter(o => o.payment_status === "paid" || o.payment_status === "confirmed").length;

  const quickLinks = [
    { to: "/orders",   icon: <Package className="w-5 h-5" />,       label: "My Orders",   desc: `${orders.length} total` },
    { to: "/profile",  icon: <User className="w-5 h-5" />,          label: "My Profile",  desc: "Edit details" },
    { to: "/wishlist", icon: <Heart className="w-5 h-5" />,         label: "Wishlist",    desc: "Saved items" },
    { to: "/track",    icon: <Truck className="w-5 h-5" />,         label: "Track Order", desc: "Live tracking" },
    { to: "/shop",     icon: <ShoppingBag className="w-5 h-5" />,   label: "Shop",        desc: "Browse products" },
    { to: "/account",  icon: <LayoutDashboard className="w-5 h-5" />, label: "Account",  desc: "Addresses & password" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-cream/40">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 space-y-8">

        {/* Welcome banner */}
        <div className="bg-white rounded-2xl shadow-card border border-border/50 p-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold leading-tight">
              Welcome back{user.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}! 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {user.phone ? `+91 ${user.phone}` : ""}
              {user.email ? (user.phone ? ` · ${user.email}` : user.email) : ""}
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
            <div className="text-2xl font-bold text-primary">{paidOrders}</div>
            <div className="text-xs text-muted-foreground">Completed orders</div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Orders", value: orders.length, icon: <Package className="w-5 h-5 text-primary" /> },
            { label: "Completed", value: paidOrders, icon: <ShoppingBag className="w-5 h-5 text-emerald-600" /> },
            { label: "In Transit", value: orders.filter(o => ["Shipped", "In Transit", "Out for Delivery"].includes(o.tracking_status)).length, icon: <Truck className="w-5 h-5 text-blue-600" /> },
            { label: "Delivered", value: orders.filter(o => o.tracking_status === "Delivered").length, icon: <MapPin className="w-5 h-5 text-amber-600" /> },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-border/50 p-4 flex flex-col gap-2 shadow-sm">
              {s.icon}
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <section>
          <h2 className="font-display text-lg font-semibold mb-3">Quick Links</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {quickLinks.map(lnk => (
              <Link
                key={lnk.to}
                to={lnk.to}
                className="flex items-center gap-3 bg-white rounded-xl p-4 border border-border/50 shadow-sm hover:border-primary/30 hover:shadow-md transition group"
              >
                <div className="text-primary shrink-0">{lnk.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{lnk.label}</div>
                  <div className="text-[11px] text-muted-foreground">{lnk.desc}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition" />
              </Link>
            ))}
          </div>
        </section>

        {/* Recent orders */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold">Recent Orders</h2>
            <Link to="/orders" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {ordersLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border/50 p-10 text-center shadow-sm">
              <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-muted-foreground text-sm mb-4">No orders yet</p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition"
              >
                <ShoppingBag className="w-4 h-4" /> Start Shopping
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentOrders.map((o: any) => {
                const items = Array.isArray(o.items) ? o.items : [];
                const status = o.payment_status ?? o.paymentStatus ?? "created";
                const trackingStatus = o.tracking_status ?? o.trackingStatus;
                const trackingId = o.tracking_id ?? o.trackingId;
                const s = STATUS_STYLES[status] ?? STATUS_STYLES.created;
                const isPaid = status === "paid" || status === "confirmed";

                return (
                  <li key={o.id} className="bg-white rounded-xl border border-border/50 shadow-sm p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] text-muted-foreground">Order ID</div>
                        <div className="font-mono font-semibold text-sm">#{o.id.slice(0, 8).toUpperCase()}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-muted-foreground">Date</div>
                        <div className="text-sm">{new Date(o.created_at ?? o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-muted-foreground">Total</div>
                        <div className="font-semibold">₹{o.total}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${s.bg}`}>{s.label}</span>
                        {trackingStatus && trackingStatus !== "Order Placed" && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TRACK_BADGE[trackingStatus] ?? "bg-muted text-muted-foreground"}`}>
                            {trackingStatus}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Items preview */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {items.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs bg-accent/40 rounded-lg px-2 py-1">
                          {item.image && <img src={item.image} alt={item.name} className="w-5 h-5 rounded object-cover" />}
                          <span className="truncate max-w-[120px]">{item.name}</span>
                          <span className="text-muted-foreground">×{item.qty}</span>
                        </div>
                      ))}
                      {items.length > 3 && (
                        <div className="text-xs text-muted-foreground bg-accent/40 rounded-lg px-2 py-1">+{items.length - 3} more</div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex flex-wrap gap-2 justify-end">
                      {isPaid && (
                        <button
                          onClick={() => downloadInvoice(o)}
                          className="inline-flex items-center gap-1.5 text-xs border border-primary/40 text-primary bg-primary/5 px-3 py-1.5 rounded-full font-semibold hover:bg-primary/10 transition"
                        >
                          <FileDown className="w-3.5 h-3.5" /> Invoice
                        </button>
                      )}
                      {trackingId && (
                        <Link
                          to="/track/$trackingId"
                          params={{ trackingId }}
                          className="inline-flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-semibold hover:opacity-90 transition"
                        >
                          <MapPin className="w-3.5 h-3.5" /> Track
                        </Link>
                      )}
                      <Link
                        to="/orders"
                        className="inline-flex items-center gap-1.5 text-xs border border-border text-muted-foreground px-3 py-1.5 rounded-full font-semibold hover:border-primary hover:text-primary transition"
                      >
                        All Orders <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Sign out */}
        <div className="text-center pb-4">
          <button
            onClick={signOut}
            className="text-sm text-muted-foreground hover:text-destructive transition"
          >
            Sign out
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
