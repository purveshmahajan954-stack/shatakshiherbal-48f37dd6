import heroImg from "@/assets/hero-product.jpg";
import { ArrowRight, Plus, Star } from "lucide-react";

const products = [
  { name: "Acidic Capsules", desc: "Powerful Ayurvedic capsules formulated to relieve acidity, heartburn & indigestion…", price: 1299, oldPrice: 1799, save: 500, rating: 4.8, reviews: 234, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 28 },
  { name: "Active G5", desc: "Advanced Ayurvedic formulation to manage blood sugar levels and support healthy…", price: 649, oldPrice: 899, save: 250, rating: 4.7, reviews: 189, badge: "NEW", badgeColor: "bg-primary-light", discount: 28 },
  { name: "Active Green", desc: "Herbal blend of potent anti-diabetic herbs to naturally regulate glucose metabolism…", price: 899, oldPrice: 1199, save: 300, rating: 4.9, reviews: 412, badge: "TOP RATED", badgeColor: "bg-gold", discount: 25 },
  { name: "Active Blue", desc: "Clinically inspired Ayurvedic formula to manage Type 2 diabetes, improve insulin…", price: 449, oldPrice: 599, save: 150, rating: 4.6, reviews: 156, badge: null, badgeColor: "", discount: 25 },
];

export function FeaturedProducts() {
  return (
    <section className="py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-xl">
            <div className="text-sm font-semibold text-primary-light tracking-[0.2em] uppercase mb-3">Handpicked For You</div>
            <h2 className="font-display text-4xl sm:text-5xl text-foreground mb-4">Featured Products</h2>
            <p className="text-muted-foreground">Our most loved Ayurvedic formulations — trusted by thousands of wellness seekers.</p>
          </div>
          <button className="inline-flex items-center gap-2 border border-primary/40 px-6 py-3 rounded-full font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-all">
            View All Products <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <article key={p.name} className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-soft transition-all">
              <div className="relative bg-accent/30">
                {p.badge && (
                  <span className={`absolute top-4 left-4 z-10 ${p.badgeColor} text-primary-foreground text-[10px] font-bold tracking-wider px-3 py-1.5 rounded`}>{p.badge}</span>
                )}
                <span className="absolute top-12 left-4 z-10 bg-gold text-white text-[10px] font-bold tracking-wider px-3 py-1.5 rounded">-{p.discount}%</span>
                <img src={heroImg} alt={p.name} loading="lazy" width={400} height={400} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" />
                <button className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground py-3 font-semibold tracking-wider text-sm opacity-0 group-hover:opacity-100 transition-opacity">QUICK ADD</button>
              </div>
              <div className="p-5">
                <div className="text-[10px] font-bold tracking-wider text-primary-light uppercase mb-2">Ayurvedic Tablets / Medicines</div>
                <h3 className="font-display text-xl font-semibold mb-2">{p.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{p.desc}</p>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.floor(p.rating) ? 'fill-gold text-gold' : 'text-muted'}`} />)}
                  </div>
                  <span className="text-sm font-semibold">{p.rating}</span>
                  <span className="text-xs text-muted-foreground">({p.reviews})</span>
                </div>
                <div className="flex items-end justify-between pt-4 border-t border-border">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-foreground">₹{p.price}</span>
                      <span className="text-sm text-muted-foreground line-through">₹{p.oldPrice}</span>
                    </div>
                    <div className="inline-block mt-1 text-[10px] font-semibold text-primary bg-accent px-2 py-0.5 rounded">Save ₹{p.save}</div>
                  </div>
                  <button className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
