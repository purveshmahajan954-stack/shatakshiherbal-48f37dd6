import { ArrowRight, Plus, Star, Zap, X } from "lucide-react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { products, CATEGORY_LABELS } from "@/lib/products";

export function FeaturedProducts() {
  const { add } = useCart();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { cat?: string };
  const cat = search.cat ?? "";
  const activeLabel = cat ? CATEGORY_LABELS[cat] : "";
  const filtered = cat ? products.filter((p) => p.categories.includes(cat)) : products;


  const handleAdd = (e: React.MouseEvent, name: string, price: number) => {
    e.preventDefault();
    e.stopPropagation();
    add(name, price);
    toast.success(`${name} added to cart`);
  };
  const handleBuyNow = (e: React.MouseEvent, name: string, price: number, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    add(name, price);
    toast.success(`Proceeding with ${name}`);
    navigate({ to: "/product/$slug", params: { slug } });
  };
  return (
    <section id="products" className="py-24 bg-cream scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
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

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No products found in this category.</div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((p) => (

            <Link to="/product/$slug" params={{ slug: p.slug }} key={p.slug} className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-soft transition-all block">
              <article>
                <div className="relative bg-accent/30">
                  {p.badge && (
                    <span className={`absolute top-4 left-4 z-10 ${p.badgeColor} text-primary-foreground text-[10px] font-bold tracking-wider px-3 py-1.5 rounded`}>{p.badge}</span>
                  )}
                  {p.discount > 0 && (
                    <span className="absolute top-12 left-4 z-10 bg-gold text-white text-[10px] font-bold tracking-wider px-3 py-1.5 rounded">-{p.discount}%</span>
                  )}
                  <img src={p.image} alt={p.name} loading="lazy" width={400} height={400} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" />
                  <button onClick={(e) => handleAdd(e, p.name, p.price)} className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground py-3 font-semibold tracking-wider text-sm opacity-0 group-hover:opacity-100 transition-opacity">QUICK ADD</button>
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
                          <span className="text-2xl font-bold text-foreground">₹{p.price}</span>
                          <span className="text-sm text-muted-foreground line-through">₹{p.oldPrice}</span>
                        </div>
                        {p.save > 0 && (
                          <div className="inline-block mt-1 text-[10px] font-semibold text-primary bg-accent px-2 py-0.5 rounded">Save ₹{p.save}</div>
                        )}
                      </div>
                      <button onClick={(e) => handleAdd(e, p.name, p.price)} aria-label={`Add ${p.name} to cart`} className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <button onClick={(e) => handleBuyNow(e, p.name, p.price, p.slug)} className="w-full inline-flex items-center justify-center gap-2 bg-gold text-white py-2.5 rounded-md font-semibold text-sm hover:bg-gold/90 transition-colors">
                      <Zap className="w-4 h-4" /> Buy Now
                    </button>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
