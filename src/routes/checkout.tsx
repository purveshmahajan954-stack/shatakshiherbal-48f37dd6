import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import type { SavedAddress } from "@/lib/auth";
import { LoginScreen } from "@/components/LoginScreen";
import { computeTotals } from "@/lib/payments.functions";
import { Loader2, ShieldCheck, MapPin, Wallet, Search, Check, Banknote, CreditCard, Phone, X } from "lucide-react";

const INDIAN_STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"];

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
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("json")) {
    throw new Error(res.ok ? "Unexpected server response" : `Request failed (${res.status})`);
  }
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
  const [flatHouse, setFlatHouse] = useState("");
  const [areaStreet, setAreaStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [payMethod, setPayMethod] = useState<"online" | "cod">("online");
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [pendingPayAction, setPendingPayAction] = useState<"online" | "cod" | null>(null);
  const [modalPhone, setModalPhone] = useState("");
  const [modalPhoneError, setModalPhoneError] = useState("");
  const pincodeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (user) {
      setEmail(user.email ?? "");
      setName(user.fullName ?? "");
      if (user.phone) {
        const digits = user.phone.replace(/\D/g, "");
        setPhone(digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.slice(-10));
      }
      // Fetch fresh saved addresses directly from API
      const token = localStorage.getItem("auth_token");
      if (token) {
        fetch("/api/user/addresses", { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(data => {
            const addrs: SavedAddress[] = data.addresses ?? [];
            setSavedAddresses(addrs);
            // Auto-fill default address
            const def = addrs.find(a => a.isDefault) ?? addrs[0];
            if (def) applyAddress(def);
          })
          .catch(() => {});
      }
    }
  }, [user]);

  const applyAddress = (addr: SavedAddress) => {
    setSelectedAddrId(addr.id);
    setFlatHouse(addr.flatHouse);
    setAreaStreet(addr.areaStreet);
    setLandmark(addr.landmark ?? "");
    setDistrict(addr.district);
    setPincode(addr.pincode);
    setCity(addr.city);
    setState(addr.state);
    setPincodeError(null);
  };

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
    setSelectedAddrId(null);
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
    const parts = [flatHouse.trim(), areaStreet.trim(), landmark.trim(), district.trim(), city.trim(), state.trim(), pincode].filter(Boolean);
    return parts.join(", ");
  };

  const validateAddress = (skipPhone = false) => {
    if (items.length === 0) { toast.error("Your cart is empty"); return false; }
    if (name.trim().length < 2) { toast.error("Please enter your name"); return false; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { toast.error("Please enter a valid email"); return false; }
    if (!skipPhone && phone.replace(/\D/g, "").length < 10) { toast.error("Please enter a valid phone number"); return false; }
    if (flatHouse.trim().length < 3) { toast.error("Please enter your flat/house address"); return false; }
    if (pincode.length !== 6) { toast.error("Please enter a valid 6-digit pincode"); return false; }
    if (!city.trim()) { toast.error("Please enter your city"); return false; }
    if (!state.trim()) { toast.error("Please enter your state"); return false; }
    return true;
  };

  const openPhoneModalFor = (action: "online" | "cod") => {
    setModalPhone("");
    setModalPhoneError("");
    setPendingPayAction(action);
    setShowPhoneModal(true);
  };

  const handleModalPhoneSubmit = () => {
    const digits = modalPhone.replace(/\D/g, "");
    if (digits.length < 10) {
      setModalPhoneError("Please enter a valid 10-digit phone number");
      return;
    }
    const normalized = digits.slice(-10);
    setPhone(normalized);
    setShowPhoneModal(false);
    if (pendingPayAction === "online") {
      setTimeout(() => handlePay(normalized), 50);
    } else if (pendingPayAction === "cod") {
      setTimeout(() => handleCOD(normalized), 50);
    }
  };

  const handleCOD = async (phoneOverride?: string) => {
    const effectivePhone = phoneOverride ?? phone;
    if (phoneOverride === undefined && effectivePhone.replace(/\D/g, "").length < 10) {
      if (!validateAddress(true)) return;
      openPhoneModalFor("cod");
      return;
    }
    if (!validateAddress(true)) return;
    const token = localStorage.getItem("auth_token");
    if (!token) return toast.error("Please sign in first");
    const fullAddress = buildFullAddress();
    setBusy(true);
    try {
      const res = await apiPost("/api/payments/cod-order", {
        items: items.map((i) => ({ slug: i.slug, qty: i.qty, name: i.name, price: i.price, image: i.image })),
        shipping: { name, email, phone: effectivePhone, address: fullAddress },
      }, token) as { orderId: string; totals: any };
      clear();
      navigate({ to: "/payment-success", search: { o: res.orderId } });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not place order. Please try again.");
      setBusy(false);
    }
  };

  const handlePay = async (phoneOverride?: string) => {
    const effectivePhone = phoneOverride ?? phone;
    if (phoneOverride === undefined && effectivePhone.replace(/\D/g, "").length < 10) {
      if (!validateAddress(true)) return;
      openPhoneModalFor("online");
      return;
    }
    if (!validateAddress(true)) return;
    const token = localStorage.getItem("auth_token");
    if (!token) return toast.error("Please sign in first");

    const fullAddress = buildFullAddress();
    setBusy(true);

    try {
      const [keyData, order] = await Promise.all([
        fetch("/api/payments/razorpay-key").then(async (r) => {
          const ct = r.headers.get("content-type") ?? "";
          if (!ct.includes("json")) throw new Error("Razorpay not configured");
          const d = await r.json();
          if (!r.ok) throw new Error(d?.error ?? "Razorpay not configured");
          return d as { keyId: string };
        }),
        apiPost("/api/payments/create-order", {
          items: items.map((i) => ({ slug: i.slug, qty: i.qty, name: i.name, price: i.price, image: i.image })),
          shipping: { name, email, phone: effectivePhone, address: fullAddress },
        }, token) as Promise<{ razorpayOrderId: string; amount: number; currency: string; orderId: string; totals: any }>,
      ]);

      const rzp = new window.Razorpay({
        key: keyData.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Shatakshi Herbal",
        description: `Order #${order.orderId.slice(0, 8)}`,
        order_id: order.razorpayOrderId,
        prefill: { name, email, contact: effectivePhone },
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

              <div className="grid sm:grid-cols-2 gap-3 mb-5">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (10 digits)" className="border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="sm:col-span-2 border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              {/* Saved address picker */}
              {savedAddresses.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Saved Addresses</p>
                  <div className="space-y-2">
                    {savedAddresses.map(addr => (
                      <button
                        key={addr.id}
                        onClick={() => applyAddress(addr)}
                        className={`w-full text-left border rounded-xl px-4 py-3 transition flex items-start gap-3 ${selectedAddrId === addr.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:border-primary/40 bg-white"}`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${selectedAddrId === addr.id ? "border-primary bg-primary" : "border-border"}`}>
                          {selectedAddrId === addr.id && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full mr-2">{addr.label}</span>
                          {addr.isDefault && <span className="text-[10px] text-amber-600 font-semibold">Default</span>}
                          <p className="text-sm text-foreground mt-1 leading-snug">
                            {[addr.flatHouse, addr.areaStreet, addr.district, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Or fill a new address below ↓</p>
                </div>
              )}

              <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase mb-1">
                  <MapPin className="w-3.5 h-3.5" /> Delivery Address
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Flat, House no., Building, Apartment</label>
                  <input value={flatHouse} onChange={(e) => { setFlatHouse(e.target.value); setSelectedAddrId(null); }} placeholder="e.g. 12B, Shanti Niwas" className="w-full border border-border bg-white rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Area, Street, Sector, Village</label>
                  <input value={areaStreet} onChange={(e) => { setAreaStreet(e.target.value); setSelectedAddrId(null); }} placeholder="e.g. Shivaji Ward, MG Road" className="w-full border border-border bg-white rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Landmark <span className="text-muted-foreground/60">(optional)</span></label>
                  <input value={landmark} onChange={(e) => { setLandmark(e.target.value); setSelectedAddrId(null); }} placeholder="e.g. Near Apollo Hospital" className="w-full border border-border bg-white rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Pincode</label>
                    <div className="relative">
                      <input
                        value={pincode}
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        placeholder="6 digit PIN"
                        inputMode="numeric"
                        maxLength={6}
                        className={`w-full border bg-white rounded-md px-4 py-2.5 text-sm pr-9 focus:outline-none focus:ring-2 focus:ring-primary ${pincodeError ? "border-red-400" : "border-border"}`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {pincodeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <Search className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                    </div>
                    {pincodeError && <p className="text-xs text-red-500">{pincodeError}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">District</label>
                    <input value={district} onChange={(e) => { setDistrict(e.target.value); setSelectedAddrId(null); }} placeholder="e.g. Narsinghpur" className="w-full border border-border bg-white rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Town / City</label>
                    <input value={city} onChange={(e) => { setCity(e.target.value); setSelectedAddrId(null); }} placeholder="e.g. Gadarwara" className="w-full border border-border bg-white rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">State</label>
                    <select value={state} onChange={(e) => { setState(e.target.value); setSelectedAddrId(null); }} className="w-full border border-border bg-white rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Choose a state</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {pincode.length === 6 && city && state && !pincodeLoading && (
                <p className="text-xs text-primary mt-2 font-medium">📍 Auto-detected: {district ? `${district}, ` : ""}{city}, {state}</p>
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

            {/* Payment Method Selection */}
            <div className="mt-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPayMethod("online")}
                  className={`flex flex-col items-center gap-1.5 border rounded-xl px-3 py-3 text-xs font-semibold transition ${payMethod === "online" ? "border-primary bg-primary/5 ring-1 ring-primary/30 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                >
                  <CreditCard className="w-5 h-5" />
                  Online / UPI
                </button>
                <button
                  onClick={() => setPayMethod("cod")}
                  className={`flex flex-col items-center gap-1.5 border rounded-xl px-3 py-3 text-xs font-semibold transition ${payMethod === "cod" ? "border-amber-500 bg-amber-50 ring-1 ring-amber-400 text-amber-700" : "border-border text-muted-foreground hover:border-amber-400"}`}
                >
                  <Banknote className="w-5 h-5" />
                  Cash on Delivery
                </button>
              </div>
              {payMethod === "cod" && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                  💵 Pay ₹{totals.total} in cash when your order arrives at your doorstep.
                </p>
              )}
            </div>

            {payMethod === "online" ? (
              <button
                onClick={handlePay}
                disabled={busy}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-full font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {busy
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                  : <><Wallet className="w-4 h-4" /> Pay ₹{totals.total}</>
                }
              </button>
            ) : (
              <button
                onClick={handleCOD}
                disabled={busy}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-amber-500 text-white py-3 rounded-full font-semibold hover:bg-amber-600 disabled:opacity-60"
              >
                {busy
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order…</>
                  : <><Banknote className="w-4 h-4" /> Place Order (COD)</>
                }
              </button>
            )}

            <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              {payMethod === "online"
                ? <span>256-bit secure payment by Razorpay. Supports UPI, Cards, Netbanking &amp; Wallets.</span>
                : <span>Cash on Delivery available. Pay when your package arrives.</span>
              }
            </div>
          </aside>
        </div>
      </main>
      <Footer />

      {/* Phone number modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPhoneModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowPhoneModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
              <Phone className="w-6 h-6 text-primary" />
            </div>

            <h3 className="font-display text-xl text-center mb-1">Phone number required</h3>
            <p className="text-sm text-muted-foreground text-center mb-5">
              We need your phone number to confirm your order and keep you updated on delivery.
            </p>

            <div className="space-y-1 mb-4">
              <div className="flex items-center border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary">
                <span className="px-3 py-2.5 bg-muted text-sm font-medium text-muted-foreground border-r border-border select-none">+91</span>
                <input
                  autoFocus
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={modalPhone}
                  onChange={(e) => { setModalPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setModalPhoneError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleModalPhoneSubmit()}
                  placeholder="10-digit mobile number"
                  className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                />
              </div>
              {modalPhoneError && <p className="text-xs text-red-500">{modalPhoneError}</p>}
            </div>

            <button
              onClick={handleModalPhoneSubmit}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-full font-semibold text-sm hover:opacity-90 transition"
            >
              {pendingPayAction === "cod" ? "Continue & Place Order" : "Continue to Payment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
