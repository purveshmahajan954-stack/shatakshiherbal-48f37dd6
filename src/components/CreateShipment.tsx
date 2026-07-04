import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Truck, Loader2, PackagePlus, CheckCircle2, AlertCircle, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { adminPost, adminPatch } from "@/lib/api-client";

type ShipmentResult = {
  awbNumber: string;
  courierName: string | null;
  shipmentId: string | null;
  shippingCost: number | null;
  labelUrl: string | null;
};

type Props = {
  orderId: string;
  awbNumber: string | null;
  courierName: string | null;
  shipmentStatus: string;
  trackingStatus: string;
  trackingId: string | null;
  labelUrl?: string | null;
  onCreated?: (result: Partial<ShipmentResult> & { cancelled?: boolean }) => void;
};

const TRACK_COLOR: Record<string, string> = {
  Packed: "bg-yellow-100 text-yellow-700",
  Shipped: "bg-blue-100 text-blue-700",
  "In Transit": "bg-indigo-100 text-indigo-700",
  "Out for Delivery": "bg-orange-100 text-orange-700",
  Delivered: "bg-emerald-100 text-emerald-700",
  RTO: "bg-red-100 text-red-700",
  Returned: "bg-red-100 text-red-700",
  Cancelled: "bg-red-100 text-red-700",
};

type LocalShipment = {
  awbNumber: string;
  courierName: string | null;
  labelUrl: string | null;
  cancelled: boolean;
};

export default function CreateShipment({
  orderId,
  awbNumber,
  courierName,
  shipmentStatus,
  trackingStatus,
  trackingId,
  labelUrl,
  onCreated,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // local override resets whenever parent orderId changes (e.g. after page reload)
  const [local, setLocal] = useState<LocalShipment | null>(null);
  useEffect(() => { setLocal(null); }, [orderId]);

  const effectiveAwb = local?.awbNumber ?? awbNumber;
  const effectiveCourier = local?.courierName ?? courierName;
  const effectiveLabelUrl = local?.labelUrl ?? labelUrl;
  const isCancelledLocally = local?.cancelled === true;
  const effectiveTrackStatus = isCancelledLocally ? "Cancelled" : trackingStatus;

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await adminPost<{ ok: boolean; result: ShipmentResult }>(
        "/api/admin/shipments",
        { order_id: orderId }
      );
      if (!data.ok) throw new Error("Shipment creation failed — please retry");
      const result = data.result;
      setLocal({ awbNumber: result.awbNumber, courierName: result.courierName, labelUrl: result.labelUrl, cancelled: false });
      onCreated?.(result);
      toast.success(`Shipment created — AWB: ${result.awbNumber}`);
    } catch (err: any) {
      const msg = err?.message ?? "Shipment creation failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleRecreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await adminPatch<{ ok: boolean; result: ShipmentResult }>(
        `/api/admin/shipments?action=recreate&order_id=${orderId}`,
        {}
      );
      if (!data.ok) throw new Error("Recreate failed — please retry");
      const result = data.result;
      setLocal({ awbNumber: result.awbNumber, courierName: result.courierName, labelUrl: result.labelUrl, cancelled: false });
      onCreated?.(result);
      toast.success(`Shipment recreated — AWB: ${result.awbNumber}`);
    } catch (err: any) {
      const msg = err?.message ?? "Recreate failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this shipment?")) return;
    setBusy(true);
    setError(null);
    try {
      const data = await adminPatch<{ ok: boolean }>(
        `/api/admin/shipments?action=cancel&order_id=${orderId}`,
        {}
      );
      if (!data.ok) throw new Error("Cancel request failed — please retry");
      // Keep AWB visible as "Cancelled" — consistent with server state (AWB still stored in DB)
      setLocal((prev) => ({
        awbNumber: prev?.awbNumber ?? awbNumber ?? "",
        courierName: prev?.courierName ?? courierName,
        labelUrl: prev?.labelUrl ?? labelUrl ?? null,
        cancelled: true,
      }));
      onCreated?.({ cancelled: true });
      toast.success("Shipment cancelled");
    } catch (err: any) {
      const msg = err?.message ?? "Cancel failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // ── No shipment yet ──────────────────────────────────────────────────────
  if (!effectiveAwb) {
    const failed = shipmentStatus?.toLowerCase().includes("failed");
    return (
      <div className="mt-3 space-y-2">
        {failed && (
          <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{shipmentStatus}</span>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <button
          onClick={handleCreate}
          disabled={busy}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackagePlus className="w-3.5 h-3.5" />}
          {busy ? "Creating Shipment…" : "Create Shipment"}
        </button>
      </div>
    );
  }

  // ── Shipment exists (may be cancelled) ──────────────────────────────────
  const cancelled = isCancelledLocally || effectiveTrackStatus === "Cancelled";
  return (
    <div className="mt-3 space-y-2">
      <div className={`border rounded-xl p-3 space-y-1.5 ${cancelled ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"}`}>
        <div className="flex items-center gap-2 flex-wrap">
          {cancelled
            ? <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            : <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
          <span className={`text-xs font-semibold ${cancelled ? "text-red-700" : "text-blue-700"}`}>
            {cancelled ? "Shipment Cancelled" : "Shipment Created"}
          </span>
          {effectiveTrackStatus && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TRACK_COLOR[effectiveTrackStatus] ?? "bg-muted text-muted-foreground"}`}>
              {effectiveTrackStatus}
            </span>
          )}
        </div>

        <div className={`text-xs space-y-1 ${cancelled ? "text-red-800" : "text-blue-800"}`}>
          <div className="flex items-center gap-2">
            <Truck className="w-3 h-3 shrink-0" />
            <span className="font-mono font-bold tracking-wide">{effectiveAwb}</span>
            {effectiveCourier && <span className={cancelled ? "text-red-600" : "text-blue-600"}>· {effectiveCourier}</span>}
          </div>
          {!cancelled && trackingId && (
            <Link
              to="/track/$trackingId"
              params={{ trackingId }}
              target="_blank"
              className="text-blue-600 hover:underline text-[10px] block"
            >
              View tracking page ↗
            </Link>
          )}
          {!cancelled && effectiveLabelUrl && (
            <a href={effectiveLabelUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-[10px] block">
              View shipping label ↗
            </a>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleRecreate}
          disabled={busy}
          className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-muted disabled:opacity-60 transition"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Recreate
        </button>
        {!cancelled && (
          <button
            onClick={handleCancel}
            disabled={busy}
            className="inline-flex items-center gap-1.5 border border-destructive/30 text-destructive bg-destructive/5 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-destructive/10 disabled:opacity-60 transition"
          >
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
            Cancel Shipment
          </button>
        )}
      </div>
    </div>
  );
}
