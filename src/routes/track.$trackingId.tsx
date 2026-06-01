import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Loader2, Package, PackageCheck, Truck, MapPin, Clock, Check, CircleDashed, XCircle, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/track/$trackingId")({
  head: ({ params }) => ({
    meta: [
      { title: `Track ${params.trackingId} — Shatakshi Herbal` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrackPage,
});

type TrackingResponse = {
  tracking_id: string;
  status: string;
  location: string | null;
  eta: string | null;
  updated_at: string;
  placed_at: string;
  items: Array<{ name: string; qty: number; price: number; image?: string }>;
  total: number;
};

const STEPS = ["Order Placed", "Packed", "Shipped", "In Transit", "Delivered"] as const;

function stepIndex(status: string) {
  const i = STEPS.indexOf(status as (typeof STEPS)[number]);
  if (i >= 0) return i;
  if (status === "Out for Delivery") return 3; // map under In Transit
  if (status === "Cancelled") return -1;
  return 0;
}

function TrackPage() {
  const { trackingId } = Route.useParams();

  const { data, isLoading, isError, refetch, isFetching } = useQuery<TrackingResponse>({
    queryKey: ["track", trackingId],
    queryFn: async () => {
      const res = await fetch(`/api/track-order?tracking_id=${encodeURIComponent(trackingId)}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    refetchInterval: 15_000, // poll every 15s
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
            className="inline-flex items-center gap-2 text-sm border border-border bg-white px-3 py-2 rounded-full hover:bg-cream"
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
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
            <p className="text-sm text-muted-foreground mb-6">Check the ID and try again.</p>
            <Link to="/orders" className="inline-block bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-semibold">My Orders</Link>
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
  const accent = isDelivered ? "text-emerald-600" : isCancelled ? "text-destructive" : "text-blue-600";
  const badgeBg = isDelivered ? "bg-emerald-100 text-emerald-700" : isCancelled ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700";

  return (
    <div className="space-y-4">
      {/* Status header */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <div className={`inline-block text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${badgeBg} mb-2`}>
              {data.status}
            </div>
            <h2 className={`font-display text-2xl ${accent}`}>
              {isDelivered ? "Delivered" : isCancelled ? "Order Cancelled" : "On the way"}
            </h2>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            Last updated<br />
            {new Date(data.updated_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </div>
        </div>

        {/* Progress bar */}
        <ol className="flex items-start gap-1 sm:gap-2">
          {STEPS.map((step, idx) => {
            const isDone = idx < current || (isDelivered && idx <= current);
            const isCurrent = idx === current && !isDelivered;
            const isLast = idx === STEPS.length - 1;
            const dot = isCancelled
              ? "bg-muted text-muted-foreground"
              : isDone
              ? "bg-emerald-500 text-white"
              : isCurrent
              ? "bg-blue-500 text-white animate-pulse"
              : "bg-muted text-muted-foreground";
            const line = isDone ? "bg-emerald-500" : "bg-border";
            const Icon = idx === 0 ? Package : idx === 1 ? PackageCheck : idx === 4 ? Check : Truck;
            return (
              <li key={step} className="flex-1 flex flex-col items-center text-center">
                <div className="flex items-center w-full">
                  <div className="flex-1 h-0.5 bg-transparent" />
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${dot}`}>
                    {isDone ? <Check className="w-4 h-4" /> : isCurrent ? <Icon className="w-4 h-4" /> : <CircleDashed className="w-4 h-4" />}
                  </div>
                  <div className={`flex-1 h-0.5 ${isLast ? "bg-transparent" : line}`} />
                </div>
                <div className={`mt-2 text-[10px] sm:text-xs font-medium leading-tight ${isCurrent ? "text-blue-600" : isDone ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {step}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Location & ETA */}
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

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="font-display text-lg mb-3">Items in this shipment</h3>
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
          <span>Total</span><span>₹{data.total}</span>
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        This page auto-refreshes every 15 seconds.
      </p>
    </div>
  );
}
