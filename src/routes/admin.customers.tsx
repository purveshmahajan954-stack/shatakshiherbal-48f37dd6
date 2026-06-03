import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { adminGet } from "@/lib/api-client";
import { Loader2, Search, Mail, Phone, MapPin, ShoppingBag, IndianRupee } from "lucide-react";

export const Route = createFileRoute("/admin/customers")({
  component: CustomersPage,
});

type Profile = { id: string; fullName: string | null; email: string | null; createdAt: string };
type Order = { id: string; userId: string; total: number; subtotal: number; gst: number; paymentStatus: string; status: string; createdAt: string; shippingName: string | null; shippingPhone: string | null; shippingAddress: string | null; email: string | null; items: { name: string; qty: number; price: number }[] };
type CustomerSummary = { profile: Profile; orders: Order[]; totalSpent: number; paidOrders: number; lastOrder: Order | null; phone: string | null; address: string | null };

function CustomersPage() {
  const [busy, setBusy] = useState(true);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setBusy(true);
      const data = await adminGet<{ profiles: Profile[]; orders: Order[] }>("/api/admin/customers").catch(() => ({ profiles: [], orders: [] }));
      const profiles = data.profiles;
      const orders = data.orders;

      const byUser = new Map<string, Order[]>();
      for (const o of orders) { const arr = byUser.get(o.userId) || []; arr.push(o); byUser.set(o.userId, arr); }

      const list: CustomerSummary[] = profiles.map((p) => {
        const userOrders = byUser.get(p.id) || [];
        const paid = userOrders.filter((o) => o.paymentStatus === "paid");
        const last = userOrders[0] || null;
        return { profile: p, orders: userOrders, totalSpent: paid.reduce((s, o) => s + Number(o.total || 0), 0), paidOrders: paid.length, lastOrder: last, phone: last?.shippingPhone || null, address: last?.shippingAddress || null };
      });
      list.sort((a, b) => b.totalSpent - a.totalSpent);
      setCustomers(list);
      setBusy(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => (c.profile.fullName || "").toLowerCase().includes(q) || (c.profile.email || "").toLowerCase().includes(q) || (c.phone || "").toLowerCase().includes(q));
  }, [customers, search]);

  if (busy) return <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email or phone…" className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center text-muted-foreground text-sm">No customers found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const isOpen = openId === c.profile.id;
            return (
              <div key={c.profile.id} className="bg-card border border-border rounded-xl">
                <button onClick={() => setOpenId(isOpen ? null : c.profile.id)} className="w-full text-left p-4 flex flex-wrap items-center gap-4 hover:bg-muted/30 transition">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold uppercase">{(c.profile.fullName || c.profile.email || "?").slice(0, 1)}</div>
                  <div className="flex-1 min-w-[180px]">
                    <div className="font-semibold">{c.profile.fullName || "—"}</div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-2"><Mail className="w-3 h-3" /> {c.profile.email || "—"}</div>
                  </div>
                  <div className="text-center"><div className="text-xs text-muted-foreground">Orders</div><div className="font-semibold">{c.orders.length}</div></div>
                  <div className="text-center"><div className="text-xs text-muted-foreground">Spent</div><div className="font-semibold">₹{c.totalSpent.toLocaleString("en-IN")}</div></div>
                </button>
                {isOpen && (
                  <div className="border-t border-border p-4 grid md:grid-cols-2 gap-6 bg-muted/20">
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Contact (admin only)</h4>
                      <div className="text-sm space-y-1.5">
                        <div className="flex items-start gap-2"><Mail className="w-4 h-4 mt-0.5 text-muted-foreground" /> {c.profile.email || "—"}</div>
                        <div className="flex items-start gap-2"><Phone className="w-4 h-4 mt-0.5 text-muted-foreground" /> {c.phone || "—"}</div>
                        <div className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /> <span className="whitespace-pre-wrap">{c.address || "—"}</span></div>
                      </div>
                      <h4 className="text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2">Stats</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><div className="text-xs text-muted-foreground">Paid orders</div><div className="font-semibold">{c.paidOrders}</div></div>
                        <div><div className="text-xs text-muted-foreground">Total orders</div><div className="font-semibold">{c.orders.length}</div></div>
                        <div className="col-span-2"><div className="text-xs text-muted-foreground">Customer since</div><div className="font-semibold">{new Date(c.profile.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</div></div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Order history</h4>
                      {c.orders.length === 0 ? <p className="text-sm text-muted-foreground">No orders yet.</p> : (
                        <ul className="text-sm divide-y divide-border border border-border rounded-lg bg-card max-h-80 overflow-y-auto">
                          {c.orders.map((o) => (
                            <li key={o.id} className="p-2.5 flex items-center gap-2">
                              <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="flex-1 truncate"><span className="font-mono text-xs">#{o.id.slice(0, 8)}</span><span className="text-muted-foreground ml-2 text-xs">{new Date(o.createdAt).toLocaleDateString("en-IN")}</span></span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{o.paymentStatus}</span>
                              <span className="font-semibold whitespace-nowrap"><IndianRupee className="w-3 h-3 inline" />{Number(o.total).toLocaleString("en-IN")}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
