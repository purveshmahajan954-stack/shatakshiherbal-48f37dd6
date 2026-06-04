import { Leaf, FlaskConical, Sprout, Trophy } from "lucide-react";
import { Link } from "@tanstack/react-router";

const heroImg = "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=800";

const stats = [
  { value: "5000+", label: "Years of Wisdom" },
  { value: "200+", label: "Organic Farms" },
  { value: "50+", label: "Formulations" },
  { value: "10K+", label: "Happy Customers" },
];

export function AyurvedicWisdom() {
  return (
    <section className="bg-dark-hero text-cream py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="font-display text-5xl lg:text-6xl leading-tight">
            5,000 Years of<br />
            <span className="italic text-gradient-green">Ayurvedic Wisdom</span>
          </h2>
          <p className="mt-6 text-base text-cream/70 max-w-lg leading-relaxed">
            Every Shatakshi product is rooted in ancient Ayurvedic texts, formulated by certified practitioners, and crafted with herbs sourced directly from organic farms across India.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-12 pb-8 border-b border-white/10">
            {stats.map(s => (
              <div key={s.label}>
                <div className="font-display text-3xl font-bold text-cream">{s.value}</div>
                <div className="text-xs text-cream/60 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { icon: Leaf, label: "AYUSH Certified" },
              { icon: FlaskConical, label: "Lab Tested" },
              { icon: Sprout, label: "100% Natural" },
              { icon: Trophy, label: "Award Winning" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-2 border border-white/15 rounded-full px-4 py-2 text-xs">
                <Icon className="w-4 h-4 text-primary-light" />{label}
              </span>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/about" className="bg-cream text-foreground px-8 py-3.5 rounded-md font-medium hover:bg-white transition">Learn Our Story</Link>
            <Link to="/shop" className="border border-cream/40 px-8 py-3.5 rounded-md font-medium hover:bg-white/5 transition">Shop Now</Link>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-3xl overflow-hidden shadow-soft">
            <img src={heroImg} alt="Ayurvedic herbs" loading="lazy" width={800} height={800} className="w-full h-full object-cover" />
          </div>
          <div className="absolute top-8 right-8 bg-white/95 text-foreground rounded-2xl px-5 py-3">
            <div className="font-display text-2xl font-bold text-primary">3000 BC</div>
            <div className="text-xs text-muted-foreground">Ancient Ayurveda</div>
          </div>
          <div className="absolute -bottom-6 left-8 bg-white text-foreground rounded-2xl px-5 py-3 flex items-center gap-3 shadow-soft">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center"><Leaf className="w-5 h-5 text-primary" /></div>
            <div>
              <div className="font-bold text-sm">100% Natural</div>
              <div className="text-xs text-muted-foreground">Zero chemicals</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
