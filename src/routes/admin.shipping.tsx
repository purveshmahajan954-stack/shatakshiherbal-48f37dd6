import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { adminGet, adminPost, adminPatch } from "@/lib/api-client";
import {
  Loader2, Truck, Package, RefreshCw, XCircle, RotateCcw,
  Printer, Eye, Search, TrendingUp, Clock, CheckCircle2, AlertTriangle,
  ExternalLink, ChevronDown, ChevronUp, ArrowRightLeft, FileText,
  Pencil, Check, X,
} from "lucide-react";
import { toast } from "sonner";
import { printShippingLabel } from "@/lib/shipping-label";

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
  shipmentFailedReason: string | null;
  items: Array<{ name: string; qty: number; price: number }>;
  createdAt: string;
};

const STATUS_BADGE: Record<string, string> = {
  "Not Created": "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  Created: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Recreated: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "Recreated (COD)": "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  "Tracking Updated": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "Shipment Failed - Retry Needed": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-semibold",
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
    const failed = shipments.filter((s) => s.shipmentStatus === "Shipment Failed - Retry Needed").length;
    const shipped = shipments.filter((s) => ["Shipped", "In Transit", "Out for Delivery"].includes(s.trackingStatus)).length;
    const delivered = shipments.filter((s) => s.trackingStatus === "Delivered").length;
    const returned = shipments.filter((s) => s.trackingStatus === "Returned").length;
    const totalCost = shipments.reduce((s, o) => s + (o.shippingCost ? Number(o.shippingCost) : 0), 0);
    return { total, notCreated, failed, shipped, delivered, returned, totalCost };
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
      const result = await adminPatch<{ ok: boolean; pending?: boolean; message?: string; labelUrl?: string | null }>(`/api/admin/shipments?action=${act}&order_id=${orderId}`, {});
      if (result?.pending) {
        toast.info(result.message ?? "Tracking not yet active — check again in a few minutes");
      } else if (act === "refresh-label") {
        if (result?.labelUrl) {
          window.open(result.labelUrl, "_blank", "noopener,noreferrer");
          toast.success("Label ready — opening in new tab");
        } else {
          toast.warning("Label URL not yet available from CKShip — try again in a minute");
        }
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
      const res = await adminPost<{ ok: boolean; result?: { labelUrl?: string | null; awbNumber?: string | null } }>("/api/admin/shipments", { order_id: orderId });
      if (res?.result?.labelUrl) {
        window.open(res.result.labelUrl, "_blank", "noopener,noreferrer");
        toast.success("Shipment created! Label opening in new tab 🖨️");
      } else {
        toast.success("Shipment created successfully");
      }
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

  const STATUSES = ["all", "Shipment Failed - Retry Needed", "Not Created", "Created", "Recreated", "Cancelled", "Tracking Updated"];

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
          { label: "Shipment Failed", value: stats.failed, icon: XCircle, color: stats.failed > 0 ? "text-red-600" : "text-muted-foreground" },
          { label: "In Transit", value: stats.shipped, icon: Truck, color: "text-blue-600" },
          { label: "Delivered", value: stats.delivered, icon: CheckCircle2, color: "text-emerald-600" },
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
                  <ShipmentRow
                    key={s.id}
                    s={s}
                    expanded={expanded}
                    setExpanded={setExpanded}
                    isBusy={isBusy}
                    createShipment={createShipment}
                    action={action}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ShipmentRow({
  s, expanded, setExpanded, isBusy, createShipment, action,
}: {
  s: Shipment;
  expanded: string | null;
  setExpanded: (id: string | null) => void;
  isBusy: (id: string, act: string) => boolean;
  createShipment: (id: string) => void;
  action: (id: string, act: string, label: string) => void;
}) {
  const [editingAwb, setEditingAwb] = useState(false);
  const [awbInput, setAwbInput] = useState(s.awbNumber ?? "");
  const [savingAwb, setSavingAwb] = useState(false);

  const saveAwb = async () => {
    const val = awbInput.trim();
    if (!val) { toast.error("AWB number cannot be empty"); return; }
    setSavingAwb(true);
    try {
      await adminPatch(`/api/admin/shipments?action=update-awb&order_id=${s.id}`, { awb_number: val });
      toast.success("AWB updated — page will reload");
      setEditingAwb(false);
      // reload to reflect change
      setTimeout(() => window.location.reload(), 800);
    } catch (err: any) {
      toast.error(err.message || "Failed to update AWB");
    } finally {
      setSavingAwb(false);
    }
  };

  return (
    <>
      <tr className="hover:bg-muted/30 transition-colors">
        <td className="px-4 py-3">
          <button onClick={() => setExpanded(expanded === s.id ? null : s.id)} className="text-muted-foreground hover:text-foreground">
            {expanded === s.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>
        <td className="px-4 py-3">
          <div className="font-medium">{s.shippingName ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{s.shippingPhone ?? s.email ?? "—"}</div>
        </td>
        <td className="px-4 py-3">
          {editingAwb ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={awbInput}
                onChange={(e) => setAwbInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveAwb(); if (e.key === "Escape") setEditingAwb(false); }}
                className="w-32 px-2 py-1 text-xs border border-primary rounded font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="AWB number"
              />
              <button onClick={saveAwb} disabled={savingAwb} className="text-emerald-600 hover:text-emerald-700 disabled:opacity-50">
                {savingAwb ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => { setEditingAwb(false); setAwbInput(s.awbNumber ?? ""); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-1 group">
              <div>
                {s.awbNumber
                  ? <><div className="font-mono text-xs font-semibold">{s.awbNumber}</div><div className="text-xs text-muted-foreground">{s.courierName ?? "—"}</div></>
                  : <span className="text-xs text-muted-foreground">Not assigned</span>
                }
              </div>
              <button
                onClick={() => { setAwbInput(s.awbNumber ?? ""); setEditingAwb(true); }}
                className="mt-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"
                title="Edit AWB"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          )}
        </td>
        <td className="px-4 py-3">
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${TRACK_BADGE[s.trackingStatus] ?? "bg-muted text-muted-foreground"}`}>
            {s.trackingStatus}
          </span>
          {s.trackingId && (
            <a href={`/track/${s.trackingId}`} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary mt-0.5 hover:underline font-mono">
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
              <ActionBtn label="Create" icon={<Package className="w-3.5 h-3.5" />} busy={isBusy(s.id, "create")} onClick={() => createShipment(s.id)} cls="bg-primary text-primary-foreground" />
            )}
            {s.shipmentStatus === "Shipment Failed - Retry Needed" && (
              <ActionBtn label="Retry" icon={<RotateCcw className="w-3.5 h-3.5" />} busy={isBusy(s.id, "create")} onClick={() => createShipment(s.id)} cls="bg-red-600 text-white border-red-600 hover:bg-red-700" />
            )}
            {s.awbNumber && (
              <>
                <ActionBtn label="Track" icon={<Truck className="w-3.5 h-3.5" />} busy={isBusy(s.id, "refresh")} onClick={() => action(s.id, "refresh", "Tracking refreshed")} />
                {s.labelUrl ? (
                  <a href={s.labelUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-border hover:bg-muted font-medium">
                    <Printer className="w-3.5 h-3.5" /> Label
                  </a>
                ) : (
                  <ActionBtn label="Label" icon={<Printer className="w-3.5 h-3.5" />} busy={isBusy(s.id, "refresh-label")} onClick={() => action(s.id, "refresh-label", "Label fetched")} />
                )}
                <ActionBtn
                  label="Print"
                  icon={<FileText className="w-3.5 h-3.5" />}
                  busy={false}
                  onClick={() => printShippingLabel({
                    id: s.id, awbNumber: s.awbNumber!, courierName: s.courierName,
                    shippingName: s.shippingName, shippingPhone: s.shippingPhone,
                    shippingAddress: s.shippingAddress, total: s.total,
                    paymentMethod: s.paymentMethod, paymentStatus: s.paymentStatus,
                    items: s.items, createdAt: s.createdAt, trackingId: s.trackingId,
                  })}
                  cls="text-primary border-primary/30 hover:bg-primary/10"
                />
                <ActionBtn label="Cancel" icon={<XCircle className="w-3.5 h-3.5" />} busy={isBusy(s.id, "cancel")} onClick={() => action(s.id, "cancel", "Shipment cancelled")} cls="text-destructive border-destructive/30 hover:bg-destructive/10" />
              </>
            )}
            {(s.shipmentStatus === "Cancelled" || (s.awbNumber && s.shipmentStatus !== "Not Created")) && (
              <ActionBtn label="Recreate" icon={<RotateCcw className="w-3.5 h-3.5" />} busy={isBusy(s.id, "recreate")} onClick={() => action(s.id, "recreate", "Shipment recreated")} />
            )}
            {s.paymentMethod === "cod" && s.paymentStatus === "cod_pending" && s.awbNumber && s.shipmentStatus !== "Cancelled" && s.shipmentStatus !== "Recreated (COD)" && (
              <ActionBtn label="Re-push COD" icon={<ArrowRightLeft className="w-3.5 h-3.5" />} busy={isBusy(s.id, "repush-as-cod")} onClick={() => action(s.id, "repush-as-cod", "Shipment re-pushed as COD")} cls="text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/30" />
            )}
            <a href={`/track/${s.trackingId ?? s.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-border hover:bg-muted font-medium">
              <Eye className="w-3.5 h-3.5" /> View
            </a>
          </div>
        </td>
      </tr>
      {expanded === s.id && (
        <tr className="bg-muted/20">
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
              {s.shipmentFailedReason && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <div className="font-medium mb-1 text-xs uppercase tracking-wider text-red-600">Shipment Failure Reason</div>
                  <p className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 font-mono break-all">{s.shipmentFailedReason}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
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
