import { ArrowRight } from "lucide-react";

const blogs = [
  { tag: "DIGESTIVE HEALTH", icon: "🌿", title: "How Ayurvedic Herbs Help Manage Acidity Naturally", excerpt: "Discover the power of Amla, Mulethi and Ajwain in neutralising stomach acid and restoring digestive balance without side effects.", date: "Mar 12, 2024", read: "5 min read", color: "oklch(0.55 0.15 155)", chipBg: "oklch(0.92 0.05 145)" },
  { tag: "DIABETES CARE", icon: "💊", title: "Karela & Jamun: Nature's Answer to Blood Sugar Control", excerpt: "Learn how bitter gourd and jamun seed extract work synergistically to improve insulin sensitivity and regulate glucose metabolism.", date: "Mar 5, 2024", read: "7 min read", color: "oklch(0.7 0.15 75)", chipBg: "oklch(0.95 0.07 90)" },
  { tag: "GENERAL WELLNESS", icon: "🌱", title: "Ashwagandha & Giloy: The Immunity Duo You Need Daily", excerpt: "Ancient Ayurvedic adaptogens that reduce stress, boost immunity and restore vitality — backed by modern clinical research.", date: "Feb 28, 2024", read: "6 min read", color: "oklch(0.5 0.15 240)", chipBg: "oklch(0.92 0.05 240)" },
  { tag: "SKIN CARE", icon: "✨", title: "Turmeric & Neem: The Ayurvedic Secret to Clear Skin", excerpt: "How these two powerful herbs fight acne, reduce inflammation and give you a natural glow without harsh chemicals.", date: "Feb 20, 2024", read: "4 min read", color: "oklch(0.55 0.2 320)", chipBg: "oklch(0.93 0.07 320)" },
  { tag: "HERBAL REMEDIES", icon: "🌾", title: "Triphala: The Three-Fruit Formula for Total Body Detox", excerpt: "Amalaki, Bibhitaki and Haritaki — understand how this ancient churna cleanses the body, improves digestion and sharpens vision.", date: "Feb 14, 2024", read: "6 min read", color: "oklch(0.6 0.2 25)", chipBg: "oklch(0.95 0.07 25)" },
  { tag: "DIABETES CARE", icon: "🍃", title: "Vijaysar Wood: The Forgotten Diabetes Remedy of Ayurveda", excerpt: "Vijaysar has been used for centuries to manage diabetes. Modern science now confirms its powerful anti-hyperglycaemic properties.", date: "Feb 8, 2024", read: "8 min read", color: "oklch(0.7 0.15 75)", chipBg: "oklch(0.95 0.07 90)" },
];

export function Blogs() {
  return (
    <section className="py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-xl">
            <div className="text-sm font-semibold text-primary-light tracking-[0.2em] uppercase mb-3">Health & Wellness</div>
            <h2 className="font-display text-4xl sm:text-5xl text-foreground mb-4">Medicinal Blogs</h2>
            <p className="text-muted-foreground">Expert insights on Ayurvedic herbs, remedies and holistic wellness from our practitioners.</p>
          </div>
          <button className="inline-flex items-center gap-2 border border-primary/40 px-6 py-3 rounded-full font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-all">
            View All Articles <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((b) => (
            <article key={b.title} className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-soft transition-all hover:-translate-y-1">
              <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${b.color}, ${b.color}88)` }} />
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider" style={{ backgroundColor: b.chipBg, color: b.color }}>{b.tag}</span>
                  <span className="text-xl">{b.icon}</span>
                </div>
                <h3 className="font-display text-xl font-semibold mb-3 leading-snug">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">{b.excerpt}</p>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">SK</div>
                    <div>
                      <div className="text-sm font-semibold">Dr. Sunil Katiya</div>
                      <div className="text-[11px] text-muted-foreground">Ayurvedic Practitioner</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">{b.date}</div>
                    <div className="text-xs font-medium" style={{ color: b.color }}>{b.read}</div>
                  </div>
                </div>
                <a href="#" className="inline-flex items-center gap-1 mt-4 text-sm font-semibold" style={{ color: b.color }}>
                  Read Article <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
