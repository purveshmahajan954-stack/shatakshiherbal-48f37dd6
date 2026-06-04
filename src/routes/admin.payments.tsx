import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, CheckCircle2, Clock, XCircle, CreditCard, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/payments")({
  component: PaymentsPage,
});

type PaymentRow = {
  id: string;
  total: number;
  subtotal: number;
  gst: number;
  payment_status: string;
  status: string;
  created_at: string;
  shipping_name: string | null;
  shipping_phone: string | null;
  email: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
};

const FILTERS = [
  { key: "all", label: "All", icon: CreditCard },
  { key: "paid", label: "Paid", icon: CheckCircle2 },
  { key: "created", label: "Pending", icon: Clock },
  { key: "failed", label: "Failed", icon: XCircle },
] as const;

function PaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setBusy(true);
      const { data } = await supabase
        .from("orders")
        .select("id,total,subtotal,gst,payment_status,status,created_at,shipping_name,shipping_phone,email,razorpay_order_id,razorpay_payment_id")
        .order("created_at", { ascending: false })
        .limit(1000);
      setRows((data as PaymentRow[]) || []);
      setBusy(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const paid = rows.filter((r) => r.payment_status === "paid");
    const pending = rows.filter((r) => r.payment_status === "created");
    const failed = rows.filter((r) => ["failed", "signature_failed"].includes(r.payment_status));
    const sum = (arr: PaymentRow[]) => arr.reduce((s, r) => s + Number(r.total || 0), 0);
    return {
      paid: { count: paid.length, value: sum(paid) },
      pending: { count: pending.length, value: sum(pending) },
      failed: { count: failed.length, value: sum(failed) },
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "paid" && r.payment_status !== "paid") return false;
      if (filter === "created" && r.payment_status !== "created") return false;
      if (filter === "failed" && !["failed", "signature_failed"].includes(r.payment_status)) return false;
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) ||
        (r.razorpay_payment_id || "").toLowerCase().includes(q) ||
        (r.razorpay_order_id || "").toLowerCase().includes(q) ||
        (r.shipping_name || "").toLowerCase().includes(q) ||
        (r.shipping_phone || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q)
      );
    });
  }, [rows, filter, search]);

  if (busy) return <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>;

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <PStat icon={CheckCircle2} label="Paid" count={stats.paid.count} value={stats.paid.value} color="green" />
        <PStat icon={Clock} label="Pending" count={stats.pending.count} value={stats.pending.value} color="amber" />
        <PStat icon={XCircle} label="Failed" count={stats.failed.count} value={stats.failed.value} color="red" />
        <PStat icon={CreditCard} label="Total Revenue" count={stats.paid.count} value={stats.paid.value} color="primary" />
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by payment ID, customer, phone…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => {
            const Icon = f.icon;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition ${
                  active ? "bg-primary text-primary-foreground" : "bg-background border border-border hover:bg-muted"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-3">Date</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Payment ID</th>
                <th className="p-3">Method</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No payments found.</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="p-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="p-3">
                    <div className="font-medium">{r.shipping_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.shipping_phone || r.email}</div>
                  </td>
                  <td className="p-3">
                    {r.razorpay_payment_id ? (
                      <button
                        onClick={() => { navigator.clipboard?.writeText(r.razorpay_payment_id!); toast.success("Copied"); }}
                        className="font-mono text-xs inline-flex items-center gap-1 hover:text-primary"
                      >
                        {r.razorpay_payment_id.slice(0, 16)}… <Copy className="w-3 h-3" />
                      </button>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="p-3 text-xs">{r.razorpay_payment_id ? "Online" : "—"}</td>
                  <td className="p-3 text-right whitespace-nowrap font-semibold">₹{Number(r.total).toLocaleString("en-IN")}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge(r.payment_status)}`}>{r.payment_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PStat({ icon: Icon, label, count, value, color }: { icon: typeof CreditCard; label: string; count: number; value: number; color: "green" | "amber" | "red" | "primary" }) {
  const colors = {
    green: "bg-green-500/10 text-green-600 dark:text-green-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
    primary: "bg-primary/10 text-primary",
  };
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-2 ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold mt-0.5">₹{value.toLocaleString("en-IN")}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{count} order{count === 1 ? "" : "s"}</div>
    </div>
  );
}

function badge(s: string) {
  const map: Record<string, string> = {
    paid: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
    created: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    failed: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
    signature_failed: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
    refunded: "bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
  };
  return map[s] || "bg-muted text-muted-foreground";
}
