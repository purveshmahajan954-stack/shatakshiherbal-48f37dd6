import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Loader2, Package, PackageCheck, Truck, MapPin, Clock,
  Check, CircleDashed, XCircle, RefreshCw, Boxes, Navigation,
} from "lucide-react";

export const Route = createFileRoute("/track/$trackingId")({
  head: ({ params }) => ({
    meta: [
      { title: `Track ${params.trackingId} — Shatakshi Herbal` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrackPage,
});

type TrackEvent = { status: string; location: string; timestamp: string; description?: string };

type TrackingResponse = {
  tracking_id: string;
  order_id: string;
  status: string;
  location: string | null;
  eta: string | null;
  updated_at: string;
  placed_at: string;
  awb_number: string | null;
  courier_name: string | null;
  shipment_status: string;
  events: TrackEvent[];
  items: Array<{ name: string; qty: number; price: number; image?: string }>;
  total: number;
};

/* Full journey steps including Out for Delivery */
const STEPS = ["Order Placed", "Packed", "Shipped", "In Transit", "Out for Delivery", "Delivered"] as const;
type Step = (typeof STEPS)[number];

function stepIndex(status: string): number {
  const idx = STEPS.indexOf(status as Step);
  if (idx >= 0) return idx;
  if (status === "RTO" || status === "Returned") return -2;
  if (status === "Cancelled") return -1;
  return 0;
}

const STEP_ICONS = [Package, PackageCheck, Truck, Navigation, Truck, Check];

function TrackPage() {
  const { trackingId } = Route.useParams();

  const { data, isLoading, isError, refetch, isFetching } = useQuery<TrackingResponse>({
    queryKey: ["track", trackingId],
    queryFn: async () => {
      const res = await fetch(`/api/track-order?tracking_id=${encodeURIComponent(trackingId)}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  return (
    <div className="min-h-screen flex flex-col bg-cream/40">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Tracking ID</p>
            <h1 className="font-display text-2xl sm:text-3xl font-mono">{trackingId}</h1>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 text-sm border border-border bg-white px-3 py-2 rounded-full hover:bg-cream transition"
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-card p-16 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
          </div>
        ) : isError || !data ? (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="font-display text-xl mb-2">Tracking ID not found</h2>
            <p className="text-sm text-muted-foreground mb-6">Check the ID and try again, or contact support.</p>
            <Link to="/orders" className="inline-block bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-semibold">
              My Orders
            </Link>
          </div>
        ) : (
          <StatusCard data={data} />
        )}
      </main>
      <Footer />
    </div>
  );
}

function StatusCard({ data }: { data: TrackingResponse }) {
  const current = stepIndex(data.status);
  const isDelivered = data.status === "Delivered";
  const isCancelled = data.status === "Cancelled";
  const isRTO = data.status === "RTO" || data.status === "Returned";

  const accent = isDelivered
    ? "text-emerald-600"
    : isRTO || isCancelled
    ? "text-destructive"
    : "text-blue-600";

  const badgeBg = isDelivered
    ? "bg-emerald-100 text-emerald-700"
    : isRTO || isCancelled
    ? "bg-red-100 text-red-700"
    : "bg-blue-100 text-blue-700";

  const statusLabel = isDelivered
    ? "Delivered — Your order arrived!"
    : isRTO
    ? "Returned to Origin"
    : isCancelled
    ? "Order Cancelled"
    : "On the way to you";

  return (
    <div className="space-y-4">
      {/* Status header card */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <div className={`inline-block text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${badgeBg} mb-2`}>
              {data.status}
            </div>
            <h2 className={`font-display text-2xl ${accent}`}>{statusLabel}</h2>
            {data.courier_name && data.awb_number && (
              <p className="text-sm text-muted-foreground mt-1">
                {data.courier_name} · AWB: <span className="font-mono">{data.awb_number}</span>
              </p>
            )}
          </div>
          <div className="text-right text-xs text-muted-foreground">
            Last updated<br />
            {new Date(data.updated_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </div>
        </div>

        {/* Progress steps */}
        {!isCancelled && !isRTO ? (
          <ol className="flex items-start gap-0.5 sm:gap-1 overflow-x-auto pb-2">
            {STEPS.map((step, idx) => {
              const isDone = idx < current || (isDelivered && idx <= current);
              const isCurrent = idx === current && !isDelivered;
              const isLast = idx === STEPS.length - 1;
              const dot = isDone
                ? "bg-emerald-500 text-white"
                : isCurrent
                ? "bg-blue-500 text-white animate-pulse"
                : "bg-muted text-muted-foreground";
              const line = isDone ? "bg-emerald-500" : "bg-border";
              const Icon = STEP_ICONS[idx];
              return (
                <li key={step} className="flex-1 flex flex-col items-center text-center min-w-0">
                  <div className="flex items-center w-full">
                    <div className={`flex-1 h-0.5 ${idx === 0 ? "bg-transparent" : line}`} />
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${dot}`}>
                      {isDone ? <Check className="w-3.5 h-3.5" /> : isCurrent ? <Icon className="w-3.5 h-3.5" /> : <CircleDashed className="w-3.5 h-3.5" />}
                    </div>
                    <div className={`flex-1 h-0.5 ${isLast ? "bg-transparent" : isDone ? "bg-emerald-500" : "bg-border"}`} />
                  </div>
                  <div className={`mt-1.5 text-[9px] sm:text-[10px] font-medium leading-tight px-0.5 ${isCurrent ? "text-blue-600" : isDone ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {step}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className={`flex items-center gap-3 p-3 rounded-lg ${isRTO ? "bg-orange-50 border border-orange-200" : "bg-red-50 border border-red-200"}`}>
            <XCircle className={`w-5 h-5 shrink-0 ${isRTO ? "text-orange-500" : "text-red-500"}`} />
            <p className="text-sm font-medium">
              {isRTO ? "Shipment is being returned to the sender." : "This order has been cancelled."}
            </p>
          </div>
        )}
      </div>

      {/* Location & ETA cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
            <MapPin className="w-4 h-4" /> Current Location
          </div>
          <p className="font-display text-lg">{data.location ?? "Awaiting pickup"}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
            <Clock className="w-4 h-4" /> Estimated Delivery
          </div>
          <p className="font-display text-lg">{data.eta ?? "—"}</p>
        </div>
      </div>

      {/* Tracking events timeline */}
      {data.events && data.events.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="font-display text-lg mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" /> Shipment Timeline
          </h3>
          <ol className="relative border-l border-border ml-3 space-y-4">
            {data.events.map((ev, idx) => (
              <li key={idx} className="ml-4">
                <div className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full border-2 border-white bg-primary" />
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold">{ev.status}</span>
                  {ev.location && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />{ev.location}
                    </span>
                  )}
                </div>
                {ev.description && (
                  <p className="text-xs text-muted-foreground">{ev.description}</p>
                )}
                {ev.timestamp && (
                  <time className="text-xs text-muted-foreground/70">{ev.timestamp}</time>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Items in shipment */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="font-display text-lg mb-3 flex items-center gap-2">
          <Boxes className="w-5 h-5 text-primary" /> Items in this shipment
        </h3>
        <ul className="divide-y divide-border">
          {(data.items ?? []).map((i, idx) => (
            <li key={idx} className="py-3 flex items-center gap-3 text-sm">
              {i.image && <img src={i.image} alt={i.name} className="w-12 h-12 rounded-md object-cover bg-accent/30" />}
              <span className="flex-1 truncate">{i.name}</span>
              <span className="text-muted-foreground">× {i.qty}</span>
              <span className="w-20 text-right font-medium">₹{i.price * i.qty}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-border mt-3 pt-3 flex justify-between font-semibold">
          <span>Total</span>
          <span>₹{data.total}</span>
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        This page auto-refreshes every 30 seconds.
      </p>
    </div>
  );
}
