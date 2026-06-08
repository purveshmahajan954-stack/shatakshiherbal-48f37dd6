import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { LoginScreen } from "@/components/LoginScreen";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2, User, Phone, Mail, Package, ShoppingBag,
  LogOut, Pencil, Check, X, Truck, FileDown, Copy,
  ChevronRight, Lock, MapPin, Eye, EyeOff,
} from "lucide-react";
import { downloadInvoice } from "@/lib/invoice";

const STATUS_STYLES: Record<string, string> = {
  paid:             "bg-primary/10 text-primary",
  confirmed:        "bg-primary/10 text-primary",
  pending:          "bg-yellow-50 text-yellow-700",
  created:          "bg-muted text-muted-foreground",
  failed:           "bg-destructive/10 text-destructive",
  signature_failed: "bg-destructive/10 text-destructive",
};
const STATUS_LABEL: Record<string, string> = {
  paid: "Paid", confirmed: "Confirmed", pending: "Pending",
  created: "Processing", failed: "Failed", signature_failed: "Failed",
};

function copyText(text: string, label: string) {
  navigator.clipboard?.writeText(text).then(() => toast.success(`${label} copied`));
}

async function patchProfile(data: Record<string, string>) {
  const token = localStorage.getItem("auth_token");
  const res = await fetch("/api/user/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to save");
  return json;
}

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — Shatakshi Herbal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

/* ── small inline editable row ─────────────────────────────────────────── */
function EditRow({
  label, icon, value, placeholder, onSave, type = "text", hint,
}: {
  label: string; icon: React.ReactNode; value: string; placeholder: string;
  onSave: (v: string) => Promise<void>; type?: string; hint?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => { if (!editing) setVal(value); }, [value, editing]);

  const save = async () => {
    setBusy(true);
    try { await onSave(val); setEditing(false); } finally { setBusy(false); }
  };

  return (
    <div className="flex items-start gap-3 bg-accent/30 rounded-lg px-4 py-3">
      <div className="mt-0.5 text-primary shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</div>
        {editing ? (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-0">
              <input
                autoFocus
                type={type === "password" && !show ? "password" : "text"}
                value={val}
                onChange={e => setVal(e.target.value)}
                placeholder={placeholder}
                className="w-full border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-8"
              />
              {type === "password" && (
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
            <button onClick={save} disabled={busy} className="text-primary disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button onClick={() => setEditing(false)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium truncate">
              {value
                ? (type === "password" ? "••••••••" : value)
                : <span className="text-muted-foreground italic">{placeholder}</span>}
            </span>
            <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-primary shrink-0">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {hint && !editing && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
      </div>
    </div>
  );
}

/* ── address textarea row ───────────────────────────────────────────────── */
function AddressRow({ value, onSave }: { value: string; onSave: (v: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!editing) setVal(value); }, [value, editing]);

  const save = async () => {
    setBusy(true);
    try { await onSave(val); setEditing(false); } finally { setBusy(false); }
  };

  return (
    <div className="flex items-start gap-3 bg-accent/30 rounded-lg px-4 py-3">
      <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">Delivery Address</div>
        {editing ? (
          <div className="space-y-2">
            <textarea
              autoFocus
              rows={3}
              value={val}
              onChange={e => setVal(e.target.value)}
              placeholder="Flat/House No, Street, City, State, PIN"
              className="w-full border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <div className="flex gap-2">
              <button onClick={save} disabled={busy} className="flex items-center gap-1 text-sm text-primary font-medium disabled:opacity-50">
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save
              </button>
              <button onClick={() => setEditing(false)} className="text-sm text-muted-foreground flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium whitespace-pre-line">
              {value || <span className="text-muted-foreground italic">Add your delivery address</span>}
            </span>
            <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-primary shrink-0 mt-0.5">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── main page ──────────────────────────────────────────────────────────── */
function AccountPage() {
  const { user, loading, signOut, refreshUser } = useAuth();
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

  const save = (field: string) => async (value: string) => {
    await patchProfile({ [field]: value });
    await refreshUser();
    toast.success("Saved!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <LoginScreen title="Sign in to view your account" subtitle="See your profile and order history" />;

  return (
    <div className="min-h-screen flex flex-col bg-cream/40">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 space-y-8">

        {/* ── Profile card ─────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-card border border-border/50 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : <User className="w-7 h-7 text-primary" />}
            </div>
            <div>
              <div className="font-semibold text-lg">{user.fullName || "My Account"}</div>
              <div className="text-xs text-muted-foreground">Member</div>
            </div>
          </div>

          <div className="space-y-3">
            {/* Name */}
            <EditRow
              label="Full Name" icon={<User className="w-4 h-4" />}
              value={user.fullName ?? ""} placeholder="Enter your name"
              onSave={save("fullName")}
            />

            {/* Phone (read-only) */}
            {user.phone && (
              <div className="flex items-center gap-3 bg-accent/30 rounded-lg px-4 py-3">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Mobile</div>
                  <div className="text-sm font-medium">{user.phone}</div>
                </div>
              </div>
            )}

            {/* Email */}
            <EditRow
              label="Email Address" icon={<Mail className="w-4 h-4" />}
              value={user.email ?? ""} placeholder="Add your email address"
              onSave={save("email")} type="email"
              hint={!user.email ? "Add email so you can sign in with password too" : undefined}
            />

            {/* Password */}
            <EditRow
              label="Password" icon={<Lock className="w-4 h-4" />}
              value={user.hasPassword ? "set" : ""}
              placeholder={user.hasPassword ? "Change password" : "Set a password (min 6 chars)"}
              onSave={save("password")} type="password"
              hint={!user.hasPassword ? "Set a password to enable email + password login" : undefined}
            />

            {/* Address */}
            <AddressRow
              value={user.address ?? ""}
              onSave={save("address")}
            />
          </div>

          <div className="mt-5 pt-5 border-t border-border/50">
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 text-sm text-destructive font-medium hover:underline"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </section>

        {/* ── Orders ───────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl">My Orders</h2>
            <span className="text-sm text-muted-foreground">{orders.length} order{orders.length !== 1 ? "s" : ""}</span>
          </div>

          {ordersLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-card border border-border/50 p-12 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground mb-6">You haven't placed any orders yet.</p>
              <Link to="/shop" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:opacity-90 transition">
                <ShoppingBag className="w-4 h-4" /> Start Shopping
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {orders.map((o: any) => {
                const items: any[] = Array.isArray(o.items) ? o.items : [];
                const statusStyle = STATUS_STYLES[o.payment_status] ?? "bg-muted text-muted-foreground";
                const statusLabel = STATUS_LABEL[o.payment_status] ?? o.payment_status;
                return (
                  <li key={o.id} className="bg-white rounded-2xl shadow-card border border-border/50 p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-border/50">
                      <div>
                        <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Order ID</div>
                        <div className="font-mono font-semibold text-sm">#{o.id.slice(0, 8).toUpperCase()}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Date</div>
                        <div className="text-sm">{new Date(o.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Total</div>
                        <div className="text-sm font-semibold">₹{o.total}</div>
                      </div>
                      <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${statusStyle}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <ul className="mt-4 space-y-2">
                      {items.map((item: any, idx: number) => (
                        <li key={idx} className="flex items-center gap-3 text-sm">
                          {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-accent/30 shrink-0" />}
                          <span className="flex-1 truncate">{item.name}</span>
                          <span className="text-muted-foreground shrink-0">× {item.qty}</span>
                          <span className="w-20 text-right font-medium shrink-0">₹{(item.price * item.qty).toLocaleString("en-IN")}</span>
                        </li>
                      ))}
                    </ul>

                    {o.shipping_address && (
                      <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Deliver to: </span>
                        {o.shipping_name && <span>{o.shipping_name}, </span>}
                        {o.shipping_address}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {(o.payment_status === "paid" || o.payment_status === "confirmed") && (
                        <button
                          onClick={() => downloadInvoice(o)}
                          className="inline-flex items-center gap-1.5 border border-primary/40 text-primary bg-primary/5 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-primary/10 transition"
                        >
                          <FileDown className="w-3.5 h-3.5" /> Invoice
                        </button>
                      )}
                      {o.tracking_id && (
                        <Link
                          to="/track/$trackingId"
                          params={{ trackingId: o.tracking_id }}
                          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-semibold hover:opacity-90 transition"
                        >
                          <Truck className="w-3.5 h-3.5" /> Track Order
                        </Link>
                      )}
                      {o.razorpay_order_id && (
                        <button
                          onClick={() => copyText(o.razorpay_order_id, "Order ID")}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
                        >
                          <Copy className="w-3 h-3" /> Copy ID
                        </button>
                      )}
                      {o.payment_status !== "paid" && o.payment_status !== "confirmed" && (
                        <Link to="/checkout" className="text-xs text-primary font-semibold hover:underline ml-auto">
                          Retry payment <ChevronRight className="w-3 h-3 inline" />
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
