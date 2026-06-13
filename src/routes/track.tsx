import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { getProductBySlug, slugify } from "@/lib/products";
import {
  Search, Phone, Hash, Loader2, Package, PackageCheck, Truck,
  MapPin, Clock, Check, CircleDashed, XCircle, RefreshCw,
  Boxes, Navigation, ChevronRight,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track Your Order — Shatakshi Herbal" },
      { name: "description", content: "Track your Shatakshi Herbal order in real-time. Enter your phone number or order ID to see live shipment status." },
    ],
  }),
  component: TrackOrderPage,
});

type Tab = "phone" | "id";

type TrackEvent = { status: string; location: string; timestamp: string; description?: string };

type TrackingData = {
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

function TrackOrderPage() {
  const [tab, setTab] = useState<Tab>("phone");
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTracking = async (params: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/track-order?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Order not found");
      setData(json);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err: any) {
      setError(err.message || "Could not find your order. Please check the details and try again.");
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (tab === "phone") {
      const digits = phone.replace(/\D/g, "").slice(-10);
      if (digits.length < 10) { setError("Please enter a valid 10-digit mobile number."); return; }
      await fetchTracking(`phone=${encodeURIComponent(digits)}`);
      const p = `phone=${encodeURIComponent(digits)}`;
      intervalRef.current = setInterval(() => fetchTracking(p, true), 30_000);
    } else {
      const q = orderId.trim();
      if (!q) { setError("Please enter an Order ID or Tracking ID."); return; }
      const param = q.includes("-") && q.length > 10
        ? `tracking_id=${encodeURIComponent(q)}`
        : `order_id=${encodeURIComponent(q)}`;
      await fetchTracking(param);
      intervalRef.current = setInterval(() => fetchTracking(param, true), 30_000);
    }
  };

  const handleRefresh = () => {
    if (!data) return;
    if (tab === "phone") {
      const digits = phone.replace(/\D/g, "").slice(-10);
      fetchTracking(`phone=${encodeURIComponent(digits)}`, true);
    } else {
      const q = orderId.trim();
      const param = q.includes("-") && q.length > 10
        ? `tracking_id=${encodeURIComponent(q)}`
        : `order_id=${encodeURIComponent(q)}`;
      fetchTracking(param, true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream/40">
      <Header />

      {/* Hero */}
      <section className="bg-primary/5 border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <Package className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-2">Track Your Order</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Enter your mobile number or Order ID to see real-time shipment status.
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">

        {/* Search card */}
        <div className="bg-white rounded-2xl shadow-card border border-border/50 p-6 sm:p-7">
          {/* Tab switcher */}
          <div className="flex rounded-xl border border-border overflow-hidden mb-5">
            <button
              type="button"
              onClick={() => { setTab("phone"); setError(null); setData(null); }}
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition ${
                tab === "phone" ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground hover:bg-gray-50"
              }`}
            >
              <Phone className="w-4 h-4" />
              Mobile Number
            </button>
            <button
              type="button"
              onClick={() => { setTab("id"); setError(null); setData(null); }}
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition ${
                tab === "id" ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground hover:bg-gray-50"
              }`}
            >
              <Hash className="w-4 h-4" />
              Order / Tracking ID
            </button>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            {tab === "phone" ? (
              <div>
                <label className="block text-sm font-medium mb-1.5">Mobile Number</label>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-3 py-2.5 border border-border rounded-xl text-sm text-muted-foreground bg-gray-50 shrink-0">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit mobile number"
                    autoComplete="tel"
                    maxLength={10}
                    required
                    className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Enter the number you used while placing the order.</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1.5">Order ID or Tracking ID</label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. SH-20240601-ABC or tracking number"
                  required
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <p className="text-xs text-muted-foreground mt-1.5">Found in your order confirmation email or SMS.</p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? "Looking up your order…" : "Track Order"}
            </button>
          </form>
        </div>

        {/* Results */}
        {data && (
          <div ref={resultRef} className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div>
                {data.tracking_id && (
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Tracking ID</p>
                )}
                <h2 className="font-display text-xl sm:text-2xl font-mono">
                  {data.tracking_id ?? data.order_id}
                </h2>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 text-sm border border-border bg-white px-3 py-2 rounded-full hover:bg-cream transition"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
            </div>

            <StatusCard data={data} />

            {data.tracking_id && (
              <div className="text-center">
                <Link
                  to="/track/$trackingId"
                  params={{ trackingId: data.tracking_id }}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Open dedicated tracking page <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            <p className="text-xs text-center text-muted-foreground">
              This page auto-refreshes every 30 seconds.
            </p>
          </div>
        )}

        {/* Help section */}
        {!data && !loading && (
          <div className="bg-white rounded-2xl border border-border/50 p-6">
            <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Need Help?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">·</span>
                Your <strong>mobile number</strong> is the one used while placing the order.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">·</span>
                Your <strong>Order ID</strong> is found in the confirmation email or your account's order history.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">·</span>
                If your order was placed less than an hour ago, tracking may not be active yet.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">·</span>
                Still need help? <Link to="/contact" className="text-primary font-medium hover:underline">Contact us</Link>
              </li>
            </ul>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function StatusCard({ data }: { data: TrackingData }) {
  const current = stepIndex(data.status);
  const isDelivered = data.status === "Delivered";
  const isCancelled = data.status === "Cancelled";
  const isRTO = data.status === "RTO" || data.status === "Returned";

  const accent = isDelivered ? "text-emerald-600" : isRTO || isCancelled ? "text-destructive" : "text-blue-600";
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
      {/* Status header */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <div className={`inline-block text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${badgeBg} mb-2`}>
              {data.status}
            </div>
            <h3 className={`font-display text-2xl ${accent}`}>{statusLabel}</h3>
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

        {/* Progress stepper */}
        {!isCancelled && !isRTO ? (
          <ol className="flex items-start gap-0.5 sm:gap-1 overflow-x-auto pb-2">
            {STEPS.map((step, idx) => {
              const isDone = idx < current || (isDelivered && idx <= current);
              const isCurrent = idx === current && !isDelivered;
              const isLast = idx === STEPS.length - 1;
              const dot = isDone ? "bg-emerald-500 text-white" : isCurrent ? "bg-blue-500 text-white animate-pulse" : "bg-muted text-muted-foreground";
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

      {/* Location + ETA */}
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

      {/* Timeline */}
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
                {ev.description && <p className="text-xs text-muted-foreground">{ev.description}</p>}
                {ev.timestamp && <time className="text-xs text-muted-foreground/70">{ev.timestamp}</time>}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="font-display text-lg mb-3 flex items-center gap-2">
          <Boxes className="w-5 h-5 text-primary" /> Items in this shipment
        </h3>
        <ul className="divide-y divide-border">
          {(data.items ?? []).map((item, idx) => {
            /* Stale Vite-hashed URLs (e.g. /_build/assets/...) break after redeploy.
               Fall back to the live publicImage from the products list. */
            const stableImage = (() => {
              if (item.image?.startsWith("/product-images/")) return item.image;
              const p = getProductBySlug(slugify(item.name));
              return p?.publicImage ?? item.image ?? null;
            })();
            return (
            <li key={idx} className="py-3 flex items-center gap-3 text-sm">
              {stableImage && (
                <img src={stableImage} alt={item.name} className="w-12 h-12 rounded-md object-cover bg-accent/30 shrink-0" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              )}
              <span className="flex-1 truncate">{item.name}</span>
              <span className="text-muted-foreground">× {item.qty}</span>
              <span className="w-20 text-right font-medium">₹{item.price * item.qty}</span>
            </li>
            );
          })}
        </ul>
        <div className="border-t border-border mt-3 pt-3 flex justify-between font-semibold">
          <span>Total</span>
          <span>₹{data.total}</span>
        </div>
      </div>
    </div>
  );
}
