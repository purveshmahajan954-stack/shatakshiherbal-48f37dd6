import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Shatakshi Herbal" },
      { name: "description", content: "Review items in your cart and proceed to secure checkout." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, total, setQty, remove, clear, count } = useCart();
  const delivery = total >= 999 || total === 0 ? 0 : 60;
  const gst = Math.round(total * 0.05);
  const grand = total + delivery + gst;

  return (
    <div className="min-h-screen flex flex-col bg-cream/40">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10">
        <h1 className="font-display text-3xl sm:text-4xl mb-2">Shopping Cart</h1>
        <p className="text-sm text-muted-foreground mb-8">{count} item{count === 1 ? "" : "s"}</p>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-card">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground mb-6">Your cart is empty.</p>
            <Link to="/shop" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:opacity-90">
              Browse products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-card divide-y divide-border">
              {items.map((i) => (
                <div key={i.name} className="p-5 flex gap-4 items-center">
                  {i.image && (
                    <img src={i.image} alt={i.name} className="w-20 h-20 rounded-lg object-cover bg-accent/30" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{i.name}</div>
                    <div className="text-sm text-muted-foreground">₹{i.price}</div>
                    <div className="mt-2 inline-flex items-center border border-border rounded-full">
                      <button onClick={() => setQty(i.name, i.qty - 1)} aria-label="Decrease" className="p-1.5 hover:text-primary"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="px-3 text-sm font-semibold">{i.qty}</span>
                      <button onClick={() => setQty(i.name, i.qty + 1)} aria-label="Increase" className="p-1.5 hover:text-primary"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">₹{i.price * i.qty}</div>
                    <button onClick={() => remove(i.name)} className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1 mt-2">
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              ))}
              <div className="p-4 text-right">
                <button onClick={clear} className="text-sm text-muted-foreground hover:text-foreground">Clear cart</button>
              </div>
            </div>

            <aside className="bg-white rounded-2xl shadow-card p-6 h-fit sticky top-24">
              <h2 className="font-display text-xl mb-4">Order Summary</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt>Subtotal</dt><dd>₹{total}</dd></div>
                <div className="flex justify-between"><dt>Delivery</dt><dd>{delivery === 0 ? <span className="text-primary font-semibold">FREE</span> : `₹${delivery}`}</dd></div>
                <div className="flex justify-between"><dt>GST (5%)</dt><dd>₹{gst}</dd></div>
                <div className="border-t border-border pt-3 flex justify-between text-base font-semibold">
                  <dt>Estimated Total</dt><dd>₹{grand}</dd>
                </div>
              </dl>
              <Link to="/checkout" className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-full font-semibold hover:opacity-90">
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-muted-foreground mt-3 text-center">Secure payments by Razorpay · UPI · Cards · Netbanking · Wallets</p>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
