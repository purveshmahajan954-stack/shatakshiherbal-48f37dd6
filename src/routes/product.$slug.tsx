import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag, Star, Zap, Leaf, Shield, Truck, Sparkles, Droplet, Sun, Moon, Heart, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getProductBySlug, sampleReviews, products, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import badgeNoSugar from "@/assets/badge-no-sugar.jpg";
import badgeGmp from "@/assets/badge-gmp.jpg";
import badgeNoExtracts from "@/assets/badge-no-extracts.jpg";
import badgeNoFlavours from "@/assets/badge-no-flavours.jpg";
import badgeBpaFree from "@/assets/badge-bpa-free.jpg";


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
  const { product } = Route.useLoaderData() as { product: Product };
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"description" | "reviews" | "info">("description");
  const gallery = [product.image, badgeNoSugar, badgeGmp, badgeNoExtracts, badgeNoFlavours, badgeBpaFree];
  const [activeImg, setActiveImg] = useState(0);


  const handleAdd = () => {
    add({ name: product.name, price: product.price, image: product.image, slug: product.slug }, qty);
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
            <div className="space-y-3">
              <div className="bg-white rounded-3xl overflow-hidden shadow-card relative">
                {product.badge && activeImg === 0 && (
                  <span className={`absolute top-5 left-5 z-10 ${product.badgeColor} text-primary-foreground text-xs font-bold tracking-wider px-3 py-1.5 rounded`}>
                    {product.badge}
                  </span>
                )}
                {/* Discount badge removed */}
                <img key={activeImg} src={gallery[activeImg]} alt={product.name} className="w-full aspect-square object-cover animate-in fade-in duration-300" />
              </div>
              <div className="grid grid-cols-6 gap-2">
                {gallery.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    aria-label={`View image ${i + 1}`}
                    className={`relative rounded-xl overflow-hidden border-2 transition aspect-square ${activeImg === i ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-primary/40"}`}
                  >
                    <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
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
                  <span className="text-4xl text-foreground">₹{product.price}</span>
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

          {/* Happy Customers strip */}
          <section className="mt-20">
            <h2 className="font-display text-3xl text-center text-foreground mb-8">Hear from our Happy Customers</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                { img: "https://i.pravatar.cc/300?img=47", name: "Mahesh Sharma", quote: "My wife used it in her first cycle and she noticed a clear difference. Thank you." },
                { img: "https://i.pravatar.cc/300?img=32", name: "Khushi Jindal", quote: "Such an effective Ayurvedic treatment for period-related issues. Highly recommend." },
                { img: "https://i.pravatar.cc/300?img=12", name: "Pooja Mehta", quote: "I'm so happy with this product. Took it for a month and felt amazing results." },
                { img: "https://i.pravatar.cc/300?img=68", name: "Vandana Rajput", quote: "Itne dino me results aate hai. I was having a regular period for the last few months." },
              ].map((c) => (
                <article key={c.name} className="bg-white rounded-2xl overflow-hidden shadow-card">
                  <div className="aspect-[4/3] bg-accent/30 overflow-hidden">
                    <img src={c.img} alt={c.name} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <div className="flex gap-0.5 mb-2">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-gold text-gold" />)}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{c.quote}</p>
                    <div className="text-[11px] font-semibold text-foreground mt-2">— {c.name}</div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Benefits highlight around product */}
          <section className="mt-20 bg-white rounded-3xl p-8 lg:p-12 shadow-card">
            <h2 className="font-display text-3xl text-center text-foreground mb-2">Key Benefits of {product.name}</h2>
            <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">A holistic formulation that supports your wellness from the inside out.</p>
            <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-8 items-center">
              <div className="space-y-6">
                {product.benefits.slice(0, Math.ceil(product.benefits.length / 2)).map((b: string, i: number) => (
                  <div key={b} className="flex items-start gap-4 lg:justify-end lg:text-right">
                    <div className="flex-1 lg:order-1">
                      <div className="font-semibold text-foreground">{b}</div>
                    </div>
                    <div className="w-12 h-12 rounded-full border-2 border-primary/30 bg-accent/30 flex items-center justify-center shrink-0 lg:order-2">
                      {[<Heart className="w-5 h-5 text-primary" />, <Sparkles className="w-5 h-5 text-primary" />, <Sun className="w-5 h-5 text-primary" />][i % 3]}
                    </div>
                  </div>
                ))}
              </div>
              <div className="relative w-full max-w-[260px] mx-auto">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold/20 to-primary/20 blur-2xl" />
                <img src={product.image} alt={product.name} className="relative w-full aspect-square object-contain" />
              </div>
              <div className="space-y-6">
                {product.benefits.slice(Math.ceil(product.benefits.length / 2)).map((b: string, i: number) => (
                  <div key={b} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-primary/30 bg-accent/30 flex items-center justify-center shrink-0">
                      {[<Droplet className="w-5 h-5 text-primary" />, <Leaf className="w-5 h-5 text-primary" />, <Shield className="w-5 h-5 text-primary" />][i % 3]}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{b}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Easy to Consume */}
          <section className="mt-12 rounded-3xl overflow-hidden bg-gradient-to-r from-accent/60 to-cream p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div className="relative">
                <img src={product.image} alt={product.name} className="w-full max-w-sm mx-auto aspect-square object-contain drop-shadow-xl" />
              </div>
              <div>
                <h2 className="font-display text-4xl text-primary mb-6">Easy to Consume!</h2>
                <ul className="space-y-4">
                  {[
                    { icon: <Droplet className="w-5 h-5 text-primary" />, text: "Shake well and take the recommended dose with warm water." },
                    { icon: <Sun className="w-5 h-5 text-primary" />, text: "Take on an empty stomach in the morning or as directed." },
                    { icon: <Moon className="w-5 h-5 text-primary" />, text: "Repeat 30 mins after dinner for best results." },
                    { icon: <Shield className="w-5 h-5 text-primary" />, text: "Store tightly closed in a cool and dry place." },
                  ].map((s, i) => (
                    <li key={i} className="flex items-start gap-3 bg-white/70 backdrop-blur rounded-xl p-4">
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">{s.icon}</div>
                      <span className="text-sm font-medium text-foreground pt-1.5">{s.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Key Ingredients */}
          <section className="mt-12 bg-white rounded-3xl p-8 lg:p-12 shadow-card">
            <h2 className="font-display text-3xl text-center text-foreground mb-2">Powerful Natural Ingredients</h2>
            <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">{product.ingredients}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {product.ingredients.split(/,|\+/).map((ing: string) => ing.trim()).filter(Boolean).slice(0, 8).map((ing: string, i: number) => (
                <div key={ing + i} className="bg-accent/30 rounded-2xl p-5 text-center hover:bg-accent/50 transition">
                  <div className="w-12 h-12 mx-auto rounded-full bg-white flex items-center justify-center mb-3">
                    <FlaskConical className="w-6 h-6 text-primary" />
                  </div>
                  <div className="font-semibold text-sm text-foreground">{ing}</div>
                </div>
              ))}
            </div>
          </section>

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
