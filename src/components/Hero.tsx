import heroImg from "@/assets/hero-product.jpg";
import { ArrowRight, Leaf, Sparkles, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-cream via-cream to-accent/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 bg-accent/60 px-4 py-2 rounded-full text-xs font-semibold text-primary mb-8">
            <span className="w-2 h-2 rounded-full bg-primary-light" />
            AYUSH CERTIFIED · 100% NATURAL
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-foreground">
            Pure Herbal<br />
            <span className="text-gradient-green italic">Healing</span><br />
            <span className="italic text-primary">for Modern Life</span>
          </h1>
          <p className="mt-8 text-base text-muted-foreground max-w-lg leading-relaxed">
            Ancient Ayurvedic wisdom, reimagined for today. Premium herbal formulations crafted from nature's finest ingredients — pure, potent, and proven.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/shop" className="group inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-md font-medium hover:bg-primary/90 transition-all shadow-soft">
              Shop Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/product-info" className="inline-flex items-center gap-2 border border-primary/30 bg-accent/40 text-foreground px-8 py-4 rounded-md font-medium hover:bg-accent transition-all">
              Explore Products
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6 sm:gap-8">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[
                  { l: "P", bg: "bg-primary" },
                  { l: "R", bg: "bg-primary-light" },
                  { l: "A", bg: "bg-dark-hero" },
                  { l: "M", bg: "bg-primary-light/70" },
                ].map((a, i) => (
                  <div key={i} className={`w-9 h-9 rounded-full ${a.bg} text-cream text-xs font-bold flex items-center justify-center ring-2 ring-cream`}>
                    {a.l}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-gold text-gold" />)}
                  </div>
                  <span className="text-sm font-bold text-foreground">4.9/5</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Trusted by 10,000+ customers</div>
              </div>
            </div>
            <div className="flex items-center gap-6 sm:gap-8 pl-2 sm:pl-4 sm:border-l border-primary/15">
              <div>
                <div className="font-display text-2xl font-bold text-primary leading-none">50+</div>
                <div className="text-xs text-muted-foreground mt-1">Products</div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-primary leading-none">100%</div>
                <div className="text-xs text-muted-foreground mt-1">Natural</div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative">
          <div className="relative rounded-3xl overflow-hidden shadow-soft bg-white">
            <img src={heroImg} alt="Shatakshi Herbal Acidic Capsules" className="w-full h-auto" width={1024} height={1024} loading="eager" fetchPriority="high" decoding="async" />
          </div>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-8 -left-4 lg:left-8 bg-white rounded-2xl shadow-soft px-5 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center"><Leaf className="w-5 h-5 text-primary" /></div>
            <div>
              <div className="font-bold text-sm">100% Organic</div>
              <div className="text-xs text-muted-foreground">Farm to bottle</div>
            </div>
          </motion.div>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity }}
            className="absolute top-[68%] -right-2 lg:right-0 bg-white rounded-2xl shadow-soft px-5 py-3 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-gold" />
            <div>
              <div className="text-[10px] font-bold text-gold tracking-wider">NEW ARRIVAL</div>
              <div className="text-sm font-semibold">Kumkumadi Serum</div>
            </div>
          </motion.div>
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4.5, repeat: Infinity }}
            className="absolute -bottom-4 right-8 bg-white rounded-2xl shadow-soft px-5 py-3 flex items-center gap-2">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-gold text-gold" />)}
            </div>
            <div className="text-sm font-bold">4.9 / 5 Rating</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
