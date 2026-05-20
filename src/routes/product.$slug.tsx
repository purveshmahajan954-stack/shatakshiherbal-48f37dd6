import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag, Star, Zap, Leaf, Shield, Truck } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getProductBySlug, sampleReviews, products } from "@/lib/products";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/product/$slug")({
  component: ProductDetailPage,
  loader: ({ params }) => {
    const product = getProductBySlug(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — Shatakshi Herbal` },
          { name: "description", content: loaderData.product.desc },
          { property: "og:title", content: `${loaderData.product.name} — Shatakshi Herbal` },
          { property: "og:description", content: loaderData.product.desc },
          { property: "og:image", content: loaderData.product.image },
        ]
      : [{ title: "Product — Shatakshi Herbal" }],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center text-center px-4">
        <div>
          <h1 className="font-display text-4xl mb-3">Product not found</h1>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
          <Link to="/shop" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Shop
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  ),
});

function ProductDetailPage() {
  const { product } = Route.useLoaderData();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"description" | "reviews" | "info">("description");

  const handleAdd = () => {
    add(product.name, product.price, qty);
    toast.success(`${qty} × ${product.name} added to cart`);
  };

  const related = products.filter((p) => p.slug !== product.slug).slice(0, 4);
  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    pct: star === 5 ? 70 : star === 4 ? 20 : star === 3 ? 7 : star === 2 ? 2 : 1,
  }));

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2 flex-wrap">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-primary">Shop</Link>
            <span>/</span>
            <span className="text-foreground font-medium">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            <div className="bg-white rounded-3xl overflow-hidden shadow-card relative">
              {product.badge && (
                <span className={`absolute top-5 left-5 z-10 ${product.badgeColor} text-primary-foreground text-xs font-bold tracking-wider px-3 py-1.5 rounded`}>
                  {product.badge}
                </span>
              )}
              {product.discount > 0 && (
                <span className="absolute top-5 right-5 z-10 bg-gold text-white text-xs font-bold tracking-wider px-3 py-1.5 rounded">
                  -{product.discount}%
                </span>
              )}
              <img src={product.image} alt={product.name} className="w-full aspect-square object-cover" />
            </div>

            <div>
              <div className="text-[11px] font-bold tracking-[0.2em] text-primary-light uppercase mb-3">{product.category}</div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4">{product.name}</h1>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`w-4 h-4 ${i <= Math.floor(product.rating) ? "fill-gold text-gold" : "text-muted"}`} />
                  ))}
                </div>
                <span className="text-sm font-semibold">{product.rating}</span>
                <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
              </div>

              <p className="text-muted-foreground leading-relaxed mb-6">{product.desc}</p>

              <div className="bg-white rounded-2xl p-6 shadow-card mb-6">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="font-display text-4xl font-bold text-foreground">₹{product.price}</span>
                  <span className="text-lg text-muted-foreground line-through">₹{product.oldPrice}</span>
                  {product.save > 0 && (
                    <span className="text-xs font-semibold text-primary bg-accent px-2 py-1 rounded">Save ₹{product.save}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-5">Inclusive of all taxes</p>

                <div className="flex items-center gap-4 mb-5">
                  <span className="text-sm font-semibold">Quantity:</span>
                  <div className="flex items-center border-2 border-border rounded-full overflow-hidden">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                      className="w-10 h-10 flex items-center justify-center hover:bg-accent transition disabled:opacity-40"
                      disabled={qty <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-semibold">{qty}</span>
                    <button
                      onClick={() => setQty((q) => Math.min(99, q + 1))}
                      aria-label="Increase quantity"
                      className="w-10 h-10 flex items-center justify-center hover:bg-accent transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm text-muted-foreground">Total: <span className="font-bold text-foreground">₹{product.price * qty}</span></span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleAdd}
                    className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-full font-semibold hover:opacity-90 transition"
                  >
                    <ShoppingBag className="w-4 h-4" /> Add to Cart
                  </button>
                  <button
                    onClick={handleAdd}
                    className="inline-flex items-center justify-center gap-2 bg-gold text-white py-3.5 rounded-full font-semibold hover:bg-gold/90 transition"
                  >
                    <Zap className="w-4 h-4" /> Buy Now
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white rounded-xl p-3 shadow-card">
                  <Leaf className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="text-[11px] font-semibold">100% Natural</div>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-card">
                  <Shield className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="text-[11px] font-semibold">AYUSH Certified</div>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-card">
                  <Truck className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="text-[11px] font-semibold">Free Shipping ₹999+</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16">
            <div className="flex gap-2 border-b border-border mb-8 overflow-x-auto">
              {([
                { id: "description", label: "Description" },
                { id: "reviews", label: `Reviews (${product.reviews})` },
                { id: "info", label: "Usage & Ingredients" },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
                    tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "description" && (
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <h2 className="font-display text-2xl mb-3">About this product</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">{product.longDesc}</p>
                </div>
                <div>
                  <h3 className="font-display text-xl mb-3">Key Benefits</h3>
                  <ul className="space-y-2">
                    {product.benefits.map((b: string) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-foreground">
                        <Leaf className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {tab === "reviews" && (
              <div className="grid md:grid-cols-3 gap-10">
                <div>
                  <div className="bg-white rounded-2xl p-6 shadow-card text-center">
                    <div className="font-display text-5xl font-bold text-foreground">{product.rating}</div>
                    <div className="flex justify-center gap-0.5 my-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className={`w-4 h-4 ${i <= Math.floor(product.rating) ? "fill-gold text-gold" : "text-muted"}`} />
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">{product.reviews} verified reviews</div>
                    <div className="space-y-2">
                      {ratingBreakdown.map((r) => (
                        <div key={r.star} className="flex items-center gap-2 text-xs">
                          <span className="w-6 text-left">{r.star}★</span>
                          <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
                            <div className="h-full bg-gold" style={{ width: `${r.pct}%` }} />
                          </div>
                          <span className="w-8 text-right text-muted-foreground">{r.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-4">
                  {sampleReviews.map((r) => (
                    <article key={r.author + r.title} className="bg-white rounded-2xl p-6 shadow-card">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            {r.author[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{r.author}</div>
                            <div className="text-xs text-muted-foreground">{r.date}</div>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i <= r.rating ? "fill-gold text-gold" : "text-muted"}`} />
                          ))}
                        </div>
                      </div>
                      <h4 className="font-semibold text-base mb-1">{r.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {tab === "info" && (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl p-6 shadow-card">
                  <h3 className="font-display text-xl mb-3">How to Use</h3>
                  <p className="text-muted-foreground leading-relaxed">{product.usage}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-card">
                  <h3 className="font-display text-xl mb-3">Ingredients</h3>
                  <p className="text-muted-foreground leading-relaxed">{product.ingredients}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-20">
            <h2 className="font-display text-3xl text-foreground mb-8">You may also like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  to="/product/$slug"
                  params={{ slug: p.slug }}
                  className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-soft transition"
                >
                  <div className="bg-accent/30 overflow-hidden">
                    <img src={p.image} alt={p.name} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-base font-semibold mb-1 line-clamp-1">{p.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">₹{p.price}</span>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 fill-gold text-gold" />
                        <span className="font-semibold">{p.rating}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
