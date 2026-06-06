import { ArrowRight, Plus, Star, Zap, X, Heart, Loader2, Search, RefreshCw } from "lucide-react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useAuth } from "@/lib/auth";
import { CATEGORY_LABELS } from "@/lib/products";
import { useProducts } from "@/lib/use-products";

const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([slug, label]) => ({ slug, label }));

export function FeaturedProducts() {
  const { add } = useCart();
  const wishlist = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { cat?: string; q?: string };
  const cat = search.cat ?? "";
  const [searchQuery, setSearchQuery] = useState(search.q ?? "");
  const activeLabel = cat ? CATEGORY_LABELS[cat] : "";
  const { items: products, loading, error, retry } = useProducts();

  const filtered = products.filter((p) => {
    const matchesCat = !cat || p.categories.includes(cat);
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.desc.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    navigate({ to: "/shop", search: { ...(cat ? { cat } : {}), ...(val ? { q: val } : {}) }, replace: true });
  };

  const handleCategoryChange = (val: string) => {
    navigate({ to: "/shop", search: { ...(val ? { cat: val } : {}), ...(searchQuery ? { q: searchQuery } : {}) }, replace: true });
  };

  const handleAdd = (e: React.MouseEvent, p: { name: string; price: number; image: string; slug: string }) => {
    e.preventDefault();
    e.stopPropagation();
    add({ name: p.name, price: p.price, image: p.image, slug: p.slug });
    toast.success(`${p.name} added to cart`);
  };
  const handleBuyNow = (e: React.MouseEvent, p: { name: string; price: number; image: string; slug: string }) => {
    e.preventDefault();
    e.stopPropagation();
    add({ name: p.name, price: p.price, image: p.image, slug: p.slug });
    if (!user) toast.info("Sign in to complete your purchase");
    navigate({ to: "/checkout" });
  };

  return (
    <section id="products" className="py-24 bg-cream scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div className="max-w-2xl">
            <div className="text-sm font-semibold text-primary-light tracking-[0.2em] uppercase mb-3">
              {activeLabel ? "Category" : "Handpicked For You"}
            </div>
            <h2 className="font-display text-4xl sm:text-5xl text-foreground mb-4">
              {activeLabel || "Featured Products"}
            </h2>
            <p className="text-muted-foreground">
              {activeLabel
                ? `Showing ${filtered.length} product${filtered.length === 1 ? "" : "s"} in this category.`
                : "Our most loved Ayurvedic formulations — trusted by thousands of wellness seekers."}
            </p>
          </div>
          {activeLabel ? (
            <Link to="/shop" className="inline-flex items-center gap-2 border border-primary/40 px-6 py-3 rounded-full font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-all">
              <X className="w-4 h-4" /> Clear filter
            </Link>
          ) : (
            <Link to="/shop" className="inline-flex items-center gap-2 border border-primary/40 px-6 py-3 rounded-full font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-all">
              View All Products <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search products by name, category, or description…"
              className="w-full pl-10 pr-10 py-2.5 text-sm border border-border rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {searchQuery && (
              <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={cat}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="sm:w-64 px-4 py-2.5 text-sm border border-border rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Loading products…</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <p className="text-muted-foreground text-sm">{error}</p>
            <button
              onClick={retry}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-semibold text-sm hover:opacity-90 transition"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-medium mb-2">No products found</p>
            <p className="text-sm">{searchQuery || cat ? "Try adjusting your search or filter." : "No products available right now."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <Link to="/product/$slug" params={{ slug: p.slug }} key={p.slug} className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-soft transition-all block">
                <article>
                  <div className="relative bg-accent/30">
                    {p.badge && (
                      <span className={`absolute top-4 left-4 z-10 ${p.badgeColor} text-primary-foreground text-[10px] font-bold tracking-wider px-3 py-1.5 rounded`}>{p.badge}</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const wasIn = wishlist.has(p.slug);
                        wishlist.toggle({ name: p.name, price: p.price, image: p.image, slug: p.slug });
                        toast.success(wasIn ? `${p.name} removed from wishlist` : `${p.name} saved to wishlist`);
                      }}
                      aria-label={wishlist.has(p.slug) ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
                      className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur shadow flex items-center justify-center hover:scale-110 transition"
                    >
                      <Heart className={`w-4 h-4 ${wishlist.has(p.slug) ? "fill-primary text-primary" : "text-foreground"}`} />
                    </button>
                    <img src={p.image} alt={p.name} loading="lazy" width={400} height={400} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" />
                    <button onClick={(e) => handleAdd(e, p)} className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground py-3 font-semibold tracking-wider text-sm opacity-0 group-hover:opacity-100 transition-opacity">QUICK ADD</button>
                  </div>
                  <div className="p-5">
                    <div className="text-[10px] font-bold tracking-wider text-primary-light uppercase mb-2">{p.category}</div>
                    <h3 className="font-display text-xl font-semibold mb-2">{p.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{p.desc}</p>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.floor(p.rating) ? 'fill-gold text-gold' : 'text-muted'}`} />)}
                      </div>
                      <span className="text-sm font-semibold">{p.rating}</span>
                      <span className="text-xs text-muted-foreground">({p.reviews})</span>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl text-foreground">₹{p.price}</span>
                          </div>
                        </div>
                        <button onClick={(e) => handleAdd(e, p)} aria-label={`Add ${p.name} to cart`} className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 transition-transform">
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      <button onClick={(e) => handleBuyNow(e, p)} className="w-full inline-flex items-center justify-center gap-2 bg-gold text-white py-2.5 rounded-md font-semibold text-sm hover:bg-gold/90 transition-colors">
                        <Zap className="w-4 h-4" /> Buy Now
                      </button>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
