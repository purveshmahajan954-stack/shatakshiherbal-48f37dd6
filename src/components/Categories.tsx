import { ArrowRight, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

const categories = [
  { name: "Skin Care", desc: "Natural glow formulas", count: 12, icon: "✨", bg: "oklch(0.92 0.05 145)", chip: "oklch(0.78 0.13 50)" },
  { name: "Herbal Powder / Churna", desc: "Pure herbal churnas", count: 10, icon: "🌾", bg: "oklch(0.93 0.07 90)", chip: "oklch(0.7 0.15 75)" },
  { name: "Ayurvedic Tablets / Medicines", desc: "Authentic formulations", count: 15, icon: "💊", bg: "oklch(0.92 0.04 200)", chip: "oklch(0.55 0.12 200)" },
  { name: "Herbal Juices", desc: "Fresh herbal extracts", count: 8, icon: "🥤", bg: "oklch(0.93 0.06 145)", chip: "oklch(0.5 0.13 155)" },
  { name: "General Wellness", desc: "Daily wellness essentials", count: 9, icon: "🌱", bg: "oklch(0.93 0.05 20)", chip: "oklch(0.65 0.16 20)" },
];

export function Categories() {
  return (
    <section className="py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-sm font-semibold text-primary-light tracking-[0.2em] uppercase mb-3">What We Offer</div>
          <h2 className="font-display text-4xl sm:text-5xl text-foreground mb-4">Shop by Category</h2>
          <p className="text-muted-foreground">Explore our range of authentic Ayurvedic products crafted from nature's finest ingredients.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {categories.map((c) => (
            <Link to="/shop" key={c.name} className="group rounded-2xl p-6 flex flex-col items-center text-center cursor-pointer hover:-translate-y-1 transition-transform shadow-card"
              style={{ backgroundColor: c.bg }}>
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-2xl mb-4 shadow-sm">{c.icon}</div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">{c.name}</h3>
              <p className="text-xs text-foreground/60 mb-4">{c.desc}</p>
              <div className="inline-flex items-center gap-1 bg-white/70 px-3 py-1.5 rounded-full text-xs font-semibold mt-auto" style={{ color: c.chip }}>
                {c.count} Products <ChevronRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-14">
          <Link to="/shop" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-md font-medium hover:bg-primary/90 transition-all shadow-soft">
            Browse All Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
