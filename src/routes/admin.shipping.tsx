import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { adminGet, adminPost, adminPatch } from "@/lib/api-client";
import {
  Loader2, Truck, Package, RefreshCw, XCircle, RotateCcw,
  Printer, Eye, Search, TrendingUp, Clock, CheckCircle2, AlertTriangle,
  ExternalLink, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/shipping")({
  component: ShippingPage,
});

type Shipment = {
  id: string;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  email: string | null;
  total: string;
  paymentStatus: string;
  paymentMethod: string;
  status: string;
  trackingId: string | null;
  trackingStatus: string;
  ckshipShipmentId: string | null;
  ckshipOrderNumber: string | null;
  awbNumber: string | null;
  courierName: string | null;
  shippingCost: string | null;
  labelUrl: string | null;
  shipmentStatus: string;
  items: Array<{ name: string; qty: number; price: number }>;
  createdAt: string;
};

const STATUS_BADGE: Record<string, string> = {
  "Not Created": "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  Created: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Recreated: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  "Tracking Updated": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

const TRACK_BADGE: Record<string, string> = {
  "Order Placed": "bg-muted text-muted-foreground",
  Packed: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  Shipped: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "In Transit": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  "Out for Delivery": "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  Delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Returned: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

function fmt(amount: string | number | null) {
  if (amount === null || amount === undefined) return "—";
  return `₹${Number(amount).toFixed(2)}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function ShippingPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [busy, setBusy] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [globalRefreshing, setGlobalRefreshing] = useState(false);

  const load = async () => {
    setBusy(true);
    try {
      const data = await adminGet<{ shipments: Shipment[] }>("/api/admin/shipments");
      setShipments(data.shipments ?? []);
    } catch {
      toast.error("Failed to load shipments");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = shipments.length;
    const notCreated = shipments.filter((s) => s.shipmentStatus === "Not Created" && (s.paymentStatus === "paid" || s.paymentMethod === "cod")).length;
    const shipped = shipments.filter((s) => ["Shipped", "In Transit", "Out for Delivery"].includes(s.trackingStatus)).length;
    const delivered = shipments.filter((s) => s.trackingStatus === "Delivered").length;
    const returned = shipments.filter((s) => s.trackingStatus === "Returned").length;
    const totalCost = shipments.reduce((s, o) => s + (o.shippingCost ? Number(o.shippingCost) : 0), 0);
    return { total, notCreated, shipped, delivered, returned, totalCost };
  }, [shipments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return shipments.filter((s) => {
      if (statusFilter !== "all" && s.shipmentStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        s.shippingName?.toLowerCase().includes(q) ||
        s.shippingPhone?.includes(q) ||
        s.awbNumber?.toLowerCase().includes(q) ||
        s.trackingId?.toLowerCase().includes(q) ||
        s.courierName?.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    });
  }, [shipments, search, statusFilter]);

  const action = async (orderId: string, act: string, label: string) => {
    setBusyId(orderId + act);
    try {
      const result = await adminPatch<{ ok: boolean; pending?: boolean; message?: string }>(`/api/admin/shipments?action=${act}&order_id=${orderId}`, {});
      if (result?.pending) {
        toast.info(result.message ?? "Tracking not yet active — check again in a few minutes");
      } else {
        toast.success(label);
      }
      await load();
    } catch (err: any) {
      toast.error(err.message || label + " failed");
    } finally {
      setBusyId(null);
    }
  };

  const createShipment = async (orderId: string) => {
    setBusyId(orderId + "create");
    try {
      await adminPost("/api/admin/shipments", { order_id: orderId });
      toast.success("Shipment created successfully");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Shipment creation failed");
    } finally {
      setBusyId(null);
    }
  };

  const refreshAll = async () => {
    setGlobalRefreshing(true);
    try {
      const data = await adminPatch<{ refreshed: number }>("/api/admin/shipments?action=refresh-all&order_id=_", {});
      toast.success(`Refreshed ${data?.refreshed ?? 0} shipments`);
      await load();
    } catch {
      toast.error("Refresh all failed");
    } finally {
      setGlobalRefreshing(false);
    }
  };

  const isBusy = (id: string, act: string) => busyId === id + act;

  const STATUSES = ["all", "Not Created", "Created", "Recreated", "Cancelled", "Tracking Updated"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Shipping Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage CKShip shipments, labels, and tracking</p>
        </div>
        <button
          onClick={refreshAll}
          disabled={globalRefreshing}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${globalRefreshing ? "animate-spin" : ""}`} />
          Refresh All Tracking
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Orders", value: stats.total, icon: Package, color: "text-foreground" },
          { label: "Pending Shipment", value: stats.notCreated, icon: AlertTriangle, color: "text-yellow-600" },
          { label: "In Transit", value: stats.shipped, icon: Truck, color: "text-blue-600" },
          { label: "Delivered", value: stats.delivered, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Returned", value: stats.returned, icon: XCircle, color: "text-red-600" },
          { label: "Shipping Cost", value: `₹${stats.totalCost.toFixed(0)}`, icon: TrendingUp, color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, phone, AWB, tracking ID…"
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s === "all" ? "All Statuses" : s}</option>)}
        </select>
        <button onClick={load} className="border border-border rounded-lg px-3 py-2 text-sm hover:bg-muted flex items-center gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" /> Reload
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {busy ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No shipments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-8"></th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">AWB / Courier</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tracking</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Shipment</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Payment</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Shipping</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s) => (
                  <>
                    <tr
                      key={s.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {expanded === s.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{s.shippingName ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{s.shippingPhone ?? s.email ?? "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        {s.awbNumber ? (
                          <>
                            <div className="font-mono text-xs font-semibold">{s.awbNumber}</div>
                            <div className="text-xs text-muted-foreground">{s.courierName ?? "—"}</div>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${TRACK_BADGE[s.trackingStatus] ?? "bg-muted text-muted-foreground"}`}>
                          {s.trackingStatus}
                        </span>
                        {s.trackingId && (
                          <a
                            href={`/track/${s.trackingId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-primary mt-0.5 hover:underline font-mono"
                          >
                            {s.trackingId} ↗
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[s.shipmentStatus] ?? "bg-muted text-muted-foreground"}`}>
                          {s.shipmentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${s.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : s.paymentStatus === "failed" ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"}`}>
                          {s.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{fmt(s.total)}</td>
                      <td className="px-4 py-3 text-right">{fmt(s.shippingCost)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(s.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {s.shipmentStatus === "Not Created" && (s.paymentStatus === "paid" || s.paymentMethod === "cod") && (
                            <ActionBtn
                              label="Create"
                              icon={<Package className="w-3.5 h-3.5" />}
                              busy={isBusy(s.id, "create")}
                              onClick={() => createShipment(s.id)}
                              cls="bg-primary text-primary-foreground"
                            />
                          )}
                          {s.awbNumber && (
                            <>
                              <ActionBtn
                                label="Track"
                                icon={<Truck className="w-3.5 h-3.5" />}
                                busy={isBusy(s.id, "refresh")}
                                onClick={() => action(s.id, "refresh", "Tracking refreshed")}
                              />
                              {s.labelUrl ? (
                                <a
                                  href={s.labelUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-border hover:bg-muted font-medium"
                                >
                                  <Printer className="w-3.5 h-3.5" /> Label
                                </a>
                              ) : (
                                <ActionBtn
                                  label="Label"
                                  icon={<Printer className="w-3.5 h-3.5" />}
                                  busy={isBusy(s.id, "refresh-label")}
                                  onClick={() => action(s.id, "refresh-label", "Label fetched")}
                                />
                              )}
                              <ActionBtn
                                label="Cancel"
                                icon={<XCircle className="w-3.5 h-3.5" />}
                                busy={isBusy(s.id, "cancel")}
                                onClick={() => action(s.id, "cancel", "Shipment cancelled")}
                                cls="text-destructive border-destructive/30 hover:bg-destructive/10"
                              />
                            </>
                          )}
                          {(s.shipmentStatus === "Cancelled" || (s.awbNumber && s.shipmentStatus !== "Not Created")) && (
                            <ActionBtn
                              label="Recreate"
                              icon={<RotateCcw className="w-3.5 h-3.5" />}
                              busy={isBusy(s.id, "recreate")}
                              onClick={() => action(s.id, "recreate", "Shipment recreated")}
                            />
                          )}
                          <a
                            href={`/track/${s.trackingId ?? s.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-border hover:bg-muted font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </a>
                        </div>
                      </td>
                    </tr>
                    {expanded === s.id && (
                      <tr key={s.id + "-expanded"} className="bg-muted/20">
                        <td colSpan={10} className="px-6 py-4">
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="font-medium mb-1 text-xs uppercase tracking-wider text-muted-foreground">Shipping Address</div>
                              <p className="text-foreground">{s.shippingAddress ?? "—"}</p>
                            </div>
                            <div>
                              <div className="font-medium mb-1 text-xs uppercase tracking-wider text-muted-foreground">Order Items</div>
                              <ul className="space-y-0.5">
                                {(s.items ?? []).map((item, idx) => (
                                  <li key={idx}>{item.name} × {item.qty} — ₹{item.price * item.qty}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <div className="font-medium mb-1 text-xs uppercase tracking-wider text-muted-foreground">CKShip Details</div>
                              <div className="space-y-0.5 text-muted-foreground">
                                <div>Shipment ID: {s.ckshipShipmentId ?? "—"}</div>
                                <div>Order #: {s.ckshipOrderNumber ?? "—"}</div>
                                <div>AWB: {s.awbNumber ?? "—"}</div>
                                <div>Courier: {s.courierName ?? "—"}</div>
                                {s.labelUrl && (
                                  <a href={s.labelUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline mt-1">
                                    <ExternalLink className="w-3 h-3" /> Download Label PDF
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  label, icon, busy, onClick, cls = "",
}: {
  label: string;
  icon: React.ReactNode;
  busy: boolean;
  onClick: () => void;
  cls?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-border hover:bg-muted font-medium disabled:opacity-60 transition ${cls}`}
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );
}
