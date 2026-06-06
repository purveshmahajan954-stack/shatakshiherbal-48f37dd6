import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Heart, Trash2, ShoppingBag, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/wishlist")({
  component: WishlistPage,
  head: () => ({
    meta: [
      { title: "Your Wishlist — Shatakshi Herbal" },
      { name: "description", content: "Products you've saved for later." },
    ],
  }),
});

function WishlistPage() {
  const { items, remove, clear } = useWishlist();
  const { add } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", search: { redirect: "/wishlist" } });
    }
  }, [user, loading, navigate]);

  const moveToCart = (i: { name: string; price: number; image?: string; slug: string }) => {
    add({ name: i.name, price: i.price, image: i.image, slug: i.slug });
    remove(i.slug);
    toast.success(`${i.name} moved to cart`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <div className="text-sm font-semibold text-primary-light tracking-[0.2em] uppercase mb-2">Saved For Later</div>
              <h1 className="font-display text-4xl text-foreground">Your Wishlist ({items.length})</h1>
            </div>
            {items.length > 0 && (
              <button onClick={clear} className="text-sm text-muted-foreground hover:text-destructive">
                Clear wishlist
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-card p-12 text-center">
              <Heart className="w-14 h-14 mx-auto text-primary/30 mb-4" />
              <h2 className="font-display text-2xl mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6">Tap the heart on any product to save it here.</p>
              <Link to="/shop" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:opacity-90 transition">
                <ArrowLeft className="w-4 h-4" /> Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {items.map((p) => (
                <article key={p.slug} className="bg-white rounded-2xl overflow-hidden shadow-card group">
                  <Link to="/product/$slug" params={{ slug: p.slug }} className="block bg-accent/30">
                    <img src={p.image} alt={p.name} loading="lazy" className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" />
                  </Link>
                  <div className="p-5">
                    <Link to="/product/$slug" params={{ slug: p.slug }} className="block">
                      <h3 className="font-display text-lg font-semibold mb-2 hover:text-primary transition">{p.name}</h3>
                    </Link>
                    <div className="text-xl font-semibold text-foreground mb-4">₹{p.price}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveToCart(p)}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition"
                      >
                        <ShoppingBag className="w-4 h-4" /> Add
                      </button>
                      <button
                        onClick={() => remove(p.slug)}
                        aria-label={`Remove ${p.name}`}
                        className="w-10 h-10 rounded-full border border-border text-muted-foreground hover:text-destructive hover:border-destructive flex items-center justify-center transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
