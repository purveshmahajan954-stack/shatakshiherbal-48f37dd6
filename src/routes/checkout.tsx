import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { LoginScreen } from "@/components/LoginScreen";
import { computeTotals } from "@/lib/payments.functions";
import { Loader2, ShieldCheck, MapPin, Wallet, Search } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Secure Checkout — Shatakshi Herbal" },
      { name: "description", content: "Pay securely via UPI, cards, netbanking, or wallets through Razorpay." },
      { name: "robots", content: "noindex" },
    ],
    scripts: [{ src: "https://checkout.razorpay.com/v1/checkout.js", async: true }],
  }),
  component: CheckoutPage,
});

declare global {
  interface Window { Razorpay: any }
}

async function apiPost(path: string, body: unknown, token: string) {
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
  return data;
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, clear } = useCart();
  const { user, loading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pincodeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (user) {
      setEmail(user.email ?? "");
      setName(user.fullName ?? "");
    }
  }, [user]);

  const fetchPincodeData = async (pin: string) => {
    if (pin.length !== 6) return;
    setPincodeLoading(true);
    setPincodeError(null);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (!Array.isArray(data) || data[0]?.Status !== "Success") {
        setPincodeError("Invalid pincode. Please check and try again.");
        setCity(""); setState(""); setDistrict("");
        return;
      }
      const po = data[0].PostOffice?.[0];
      if (po) {
        setCity(po.Division || po.Name || "");
        setState(po.State || "");
        setDistrict(po.District || "");
      }
    } catch {
      setPincodeError("Could not fetch pincode data. Please fill manually.");
    } finally {
      setPincodeLoading(false);
    }
  };

  const handlePincodeChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 6);
    setPincode(digits);
    setPincodeError(null);
    if (pincodeTimeout.current) clearTimeout(pincodeTimeout.current);
    if (digits.length === 6) {
      pincodeTimeout.current = setTimeout(() => fetchPincodeData(digits), 400);
    } else {
      setCity(""); setState(""); setDistrict("");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
  if (!user) return <LoginScreen title="Sign in to checkout" subtitle="Your cart is saved — sign in to complete your order securely" />;

  const totals = computeTotals(total);

  const buildFullAddress = () => {
    const parts = [streetAddress.trim(), district || "", city.trim(), state.trim(), pincode].filter(Boolean);
    return parts.join(", ");
  };

  const handlePay = async () => {
    if (items.length === 0) return toast.error("Your cart is empty");
    if (name.trim().length < 2) return toast.error("Please enter your name");
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error("Please enter a valid email");
    if (phone.replace(/\D/g, "").length < 10) return toast.error("Please enter a valid phone number");
    if (streetAddress.trim().length < 5) return toast.error("Please enter your street address");
    if (pincode.length !== 6) return toast.error("Please enter a valid 6-digit pincode");
    if (!city.trim()) return toast.error("Please enter your city");
    if (!state.trim()) return toast.error("Please enter your state");

    const token = localStorage.getItem("auth_token");
    if (!token) return toast.error("Please sign in first");

    const fullAddress = buildFullAddress();
    setBusy(true);

    try {
      const [keyData, order] = await Promise.all([
        fetch("/api/payments/razorpay-key").then(async (r) => {
          const d = await r.json();
          if (!r.ok) throw new Error(d?.error ?? "Razorpay not configured");
          return d as { keyId: string };
        }),
        apiPost("/api/payments/create-order", {
          items: items.map((i) => ({ slug: i.slug, qty: i.qty, name: i.name, price: i.price, image: i.image })),
          shipping: { name, email, phone, address: fullAddress },
        }, token) as Promise<{ razorpayOrderId: string; amount: number; currency: string; orderId: string; totals: any }>,
      ]);

      const rzp = new window.Razorpay({
        key: keyData.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Shatakshi Herbal",
        description: `Order #${order.orderId.slice(0, 8)}`,
        order_id: order.razorpayOrderId,
        prefill: { name, email, contact: phone },
        notes: { address: fullAddress },
        theme: { color: "#2D5016" },
        method: { upi: true, card: true, netbanking: true, wallet: true },
        handler: async (resp: any) => {
          try {
            await apiPost("/api/payments/verify", {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            }, token);
            clear();
            navigate({ to: "/payment-success", search: { o: order.orderId } });
          } catch (e: any) {
            navigate({ to: "/payment-failed", search: { r: order.razorpayOrderId, reason: e?.message ?? "verification_failed" } });
          }
        },
        modal: {
          ondismiss: async () => {
            await fetch("/api/payments/mark-failed", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ razorpay_order_id: order.razorpayOrderId }),
            }).catch(() => {});
            setBusy(false);
            navigate({ to: "/payment-failed", search: { r: order.razorpayOrderId, reason: "dismissed" } });
          },
        },
      });

      rzp.on("payment.failed", async (resp: any) => {
        await fetch("/api/payments/mark-failed", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ razorpay_order_id: order.razorpayOrderId }),
        }).catch(() => {});
        navigate({ to: "/payment-failed", search: { r: order.razorpayOrderId, reason: resp?.error?.description ?? "failed" } });
      });

      rzp.open();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start payment. Please try again.");
      setBusy(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-20 text-center">
          <h1 className="font-display text-3xl mb-4">Your cart is empty</h1>
          <Link to="/shop" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold">Browse Products</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream/40">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10">
        <h1 className="font-display text-3xl sm:text-4xl mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-2xl shadow-card p-6">
              <h2 className="flex items-center gap-2 font-display text-xl mb-4">
                <MapPin className="w-5 h-5 text-primary" /> Shipping Address
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (10 digits)" className="border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="sm:col-span-2 border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <textarea value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="House no., street, landmark" rows={2} className="sm:col-span-2 border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />

                <div className="relative">
                  <input
                    value={pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="6-digit Pincode"
                    inputMode="numeric"
                    maxLength={6}
                    className={`w-full border rounded-md px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-primary ${pincodeError ? "border-red-400" : "border-border"}`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {pincodeLoading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Search className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  {pincodeError && <p className="text-xs text-red-500 mt-1">{pincodeError}</p>}
                </div>

                <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="District" className="border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City / Division" className="border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className="border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              {pincode.length === 6 && city && state && !pincodeLoading && (
                <p className="text-xs text-primary mt-3 font-medium">📍 Auto-detected: {city}, {state}</p>
              )}
            </section>

            <section className="bg-white rounded-2xl shadow-card p-6">
              <h2 className="font-display text-xl mb-4">Order Items ({items.length})</h2>
              <ul className="divide-y divide-border">
                {items.map((i) => (
                  <li key={i.name} className="py-3 flex items-center gap-4">
                    {i.image && <img src={i.image} alt={i.name} className="w-14 h-14 rounded-md object-cover bg-accent/30" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{i.name}</div>
                      <div className="text-xs text-muted-foreground">Qty {i.qty} · ₹{i.price}</div>
                    </div>
                    <div className="font-semibold">₹{i.price * i.qty}</div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="bg-white rounded-2xl shadow-card p-6 h-fit lg:sticky lg:top-24">
            <h2 className="font-display text-xl mb-4">Order Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt>Product Subtotal</dt><dd>₹{totals.subtotal}</dd></div>
              <div className="flex justify-between"><dt>Courier Charges</dt><dd>₹{totals.delivery}</dd></div>
              <div className="border-t border-border pt-3 flex justify-between text-lg font-semibold">
                <dt>Grand Total</dt><dd>₹{totals.total}</dd>
              </div>
            </dl>

            <button
              onClick={handlePay}
              disabled={busy}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-full font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {busy
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                : <><Wallet className="w-4 h-4" /> Pay ₹{totals.total}</>
              }
            </button>

            <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>256-bit secure payment by Razorpay. Supports UPI, Cards, Netbanking &amp; Wallets.</span>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
