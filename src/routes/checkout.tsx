import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { LoginScreen } from "@/components/LoginScreen";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  markPaymentFailed,
  getRazorpayKeyId,
  computeTotals,
} from "@/lib/payments.functions";
import { Loader2, ShieldCheck, MapPin, Wallet } from "lucide-react";

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

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, clear } = useCart();
  const { user, loading } = useAuth();
  const createOrder = useServerFn(createRazorpayOrder);
  const verify = useServerFn(verifyRazorpayPayment);
  const markFailed = useServerFn(markPaymentFailed);
  const fetchKeyId = useServerFn(getRazorpayKeyId);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email ?? "");
      setName((user.user_metadata as any)?.full_name ?? "");
    }
  }, [user]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  );
  if (!user) return <LoginScreen title="Sign in to checkout" subtitle="Your cart is saved — sign in to complete your order securely" />;

  const totals = computeTotals(total);


  const handlePay = async () => {
    if (items.length === 0) return toast.error("Your cart is empty");
    if (name.trim().length < 2) return toast.error("Please enter your name");
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error("Please enter a valid email");
    if (phone.replace(/\D/g, "").length < 10) return toast.error("Please enter a valid phone number");
    if (address.trim().length < 10) return toast.error("Please enter your full shipping address");

    setBusy(true);
    try {
      const [{ keyId }, order] = await Promise.all([
        fetchKeyId(),
        createOrder({
          data: {
            items: items.map((i) => ({ name: i.name, price: i.price, qty: i.qty, image: i.image, slug: i.slug })),
            shipping: { name, email, phone, address },
          },
        }),
      ]);

      const rzp = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Shatakshi Herbal",
        description: `Order #${order.orderId.slice(0, 8)}`,
        order_id: order.razorpayOrderId,
        prefill: { name, email, contact: phone },
        notes: { address },
        theme: { color: "#2D5016" },
        method: { upi: true, card: true, netbanking: true, wallet: true },
        handler: async (resp: any) => {
          try {
            await verify({ data: {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            }});
            clear();
            navigate({ to: "/payment-success", search: { o: order.orderId } });
          } catch (e: any) {
            navigate({ to: "/payment-failed", search: { r: order.razorpayOrderId, reason: e?.message ?? "verification_failed" } });
          }
        },
        modal: {
          ondismiss: async () => {
            await markFailed({ data: { razorpay_order_id: order.razorpayOrderId, reason: "dismissed" } }).catch(() => {});
            setBusy(false);
            navigate({ to: "/payment-failed", search: { r: order.razorpayOrderId, reason: "dismissed" } });
          },
        },
      });
      rzp.on("payment.failed", async (resp: any) => {
        await markFailed({ data: { razorpay_order_id: order.razorpayOrderId, reason: resp?.error?.description ?? "failed" } }).catch(() => {});
        navigate({ to: "/payment-failed", search: { r: order.razorpayOrderId, reason: resp?.error?.description ?? "failed" } });
      });
      rzp.open();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start payment");
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
            {/* Address */}
            <section className="bg-white rounded-2xl shadow-card p-6">
              <h2 className="flex items-center gap-2 font-display text-xl mb-4"><MapPin className="w-5 h-5 text-primary" /> Shipping Address</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (10 digits)" className="border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="sm:col-span-2 border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House no., street, city, state, PIN" rows={3} className="sm:col-span-2 border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
              </div>
            </section>

            {/* Items */}
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

          {/* Summary */}
          <aside className="bg-white rounded-2xl shadow-card p-6 h-fit lg:sticky lg:top-24">
            <h2 className="font-display text-xl mb-4">Order Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt>Product Subtotal</dt><dd>₹{totals.subtotal}</dd></div>
              <div className="flex justify-between"><dt>GST (5%)</dt><dd>₹{totals.gst}</dd></div>
              <div className="flex justify-between"><dt>Courier Charges</dt><dd>₹{totals.delivery}</dd></div>
              <div className="border-t border-border pt-3 flex justify-between text-lg font-semibold">
                <dt>Grand Total</dt><dd>₹{totals.total}</dd>
              </div>
            </dl>


            <button onClick={handlePay} disabled={busy} className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-full font-semibold hover:opacity-90 disabled:opacity-60">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : <><Wallet className="w-4 h-4" /> Pay ₹{totals.total}</>}
            </button>

            <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>256-bit secure payment by Razorpay. Supports UPI, Cards, Netbanking & Wallets.</span>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
