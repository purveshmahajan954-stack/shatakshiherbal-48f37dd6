import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Shield, Users, ShoppingBag, MessageSquare, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin Panel — Shatakshi Herbal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Profile = { id: string; full_name: string | null; email: string | null; created_at: string };
type Order = { id: string; user_id: string; items: any; total: number; status: string; created_at: string; shipping_name: string | null; shipping_phone: string | null; shipping_address: string | null };
type Message = { id: string; name: string; email: string; phone: string | null; message: string; created_at: string };

function AdminPage() {
  const { isAdmin, loading, user } = useAuth();
  const [tab, setTab] = useState<"users" | "orders" | "messages">("orders");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    setBusy(true);
    Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }),
    ]).then(([p, o, m]) => {
      setProfiles((p.data as Profile[]) || []);
      setOrders((o.data as Order[]) || []);
      setMessages((m.data as Message[]) || []);
      setBusy(false);
    });
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-24 text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-3xl mb-3">Access Restricted</h1>
          <p className="text-muted-foreground mb-2">You don't have permission to view the admin panel.</p>
          <p className="text-xs text-muted-foreground/80 mb-6">Signed in as: <span className="font-mono">{user?.email}</span></p>
          <Link to="/" className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-medium">Back home</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const tabs = [
    { id: "orders" as const, label: "Orders", icon: ShoppingBag, count: orders.length },
    { id: "users" as const, label: "Users", icon: Users, count: profiles.length },
    { id: "messages" as const, label: "Messages", icon: MessageSquare, count: messages.length },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="font-display text-3xl text-foreground">Admin Panel</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">Manage orders, users, and contact submissions.</p>

        <div className="flex gap-2 border-b border-border mb-6 overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{t.count}</span>
              </button>
            );
          })}
        </div>

        {busy ? (
          <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>
        ) : (
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            {tab === "orders" && <OrdersTable rows={orders} />}
            {tab === "users" && <UsersTable rows={profiles} />}
            {tab === "messages" && <MessagesTable rows={messages} />}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="py-16 text-center text-muted-foreground text-sm">{label}</div>;
}

function fmt(d: string) {
  return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function OrdersTable({ rows }: { rows: Order[] }) {
  if (!rows.length) return <Empty label="No orders yet." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr><th className="p-3">Date</th><th className="p-3">User ID</th><th className="p-3">Items</th><th className="p-3">Total</th><th className="p-3">Status</th></tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id} className="border-t border-border">
              <td className="p-3 whitespace-nowrap">{fmt(o.created_at)}</td>
              <td className="p-3 font-mono text-xs">{o.user_id.slice(0, 8)}…</td>
              <td className="p-3">
                {Array.isArray(o.items) ? o.items.map((i: any) => `${i.name} ×${i.qty}`).join(", ") : "—"}
              </td>
              <td className="p-3 font-semibold">₹{Number(o.total).toLocaleString("en-IN")}</td>
              <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{o.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsersTable({ rows }: { rows: Profile[] }) {
  if (!rows.length) return <Empty label="No users yet." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr><th className="p-3">Joined</th><th className="p-3">Name</th><th className="p-3">Email</th></tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-border">
              <td className="p-3 whitespace-nowrap">{fmt(p.created_at)}</td>
              <td className="p-3">{p.full_name || "—"}</td>
              <td className="p-3">{p.email || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MessagesTable({ rows }: { rows: Message[] }) {
  if (!rows.length) return <Empty label="No contact messages yet." />;
  return (
    <div className="divide-y divide-border">
      {rows.map((m) => (
        <div key={m.id} className="p-4">
          <div className="flex justify-between items-start gap-3 mb-1">
            <div>
              <div className="font-semibold">{m.name}</div>
              <div className="text-xs text-muted-foreground">{m.email}{m.phone ? ` • ${m.phone}` : ""}</div>
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">{fmt(m.created_at)}</div>
          </div>
          <p className="text-sm text-foreground/90 mt-2 whitespace-pre-wrap">{m.message}</p>
        </div>
      ))}
    </div>
  );
}
