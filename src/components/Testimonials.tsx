import { Quote, Star, MapPin, Heart, Sparkles, Award } from "lucide-react";
import { Link } from "@tanstack/react-router";

const stats = [
  { icon: Star, value: "4.9", label: "Average Rating", color: "text-gold" },
  { icon: Heart, value: "10K+", label: "Happy Patients", color: "text-primary-light" },
  { icon: Sparkles, value: "98%", label: "Recommend Us", color: "text-gold" },
  { icon: Award, value: "5000+", label: "Reviews Written", color: "text-gold" },
];

const testimonials = [
  { name: "Priya Sharma", initials: "PS", city: "Mumbai", product: "Acidic Capsules", text: "The Kumkumadi serum has completely transformed my skin! After just 3 weeks, my dark spots have visibly reduced and my skin glows naturally." },
  { name: "Rahul Verma", initials: "RV", city: "Delhi", product: "Active G5", text: "Ashwagandha capsules are a game changer. My stress levels have dropped significantly and I sleep so much better now. Highly recommend!" },
  { name: "Ananya Patel", initials: "AP", city: "Bangalore", product: "Active Green", text: "Bhringraj oil is absolutely magical. My hair fall has reduced by 80% and my hair feels so thick and healthy. Pure Ayurvedic goodness!" },
  { name: "Meera Nair", initials: "MN", city: "Chennai", product: "Active Blue", text: "The Tulsi Green Tea is my morning ritual now. It keeps me energized and focused throughout the day. The aroma is divine!" },
];

export function Testimonials() {
  return (
    <section className="bg-dark-hero text-cream py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-5xl text-cream mb-4">What Our Patients Say</h2>
          <p className="text-cream/70">Real stories from real patients who transformed their health with Shatakshi Herbal.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16 bg-white/5 rounded-2xl p-2">
          {stats.map(s => (
            <div key={s.label} className="text-center py-6 border-r border-white/5 last:border-r-0">
              <s.icon className={`w-7 h-7 mx-auto mb-3 ${s.color}`} />
              <div className="font-display text-3xl font-bold">{s.value}</div>
              <div className="text-xs text-cream/60 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {testimonials.map(t => (
            <div key={t.name} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-light to-gold/50" />
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-5">
                <Quote className="w-5 h-5 text-primary-light" />
              </div>
              <div className="flex gap-0.5 mb-4">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-gold text-gold" />)}
              </div>
              <p className="text-sm text-cream/85 leading-relaxed mb-6">"{t.text}"</p>
              <div className="inline-flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full text-[11px] text-primary-light mb-5">
                🌿 Verified Purchase · {t.product}
              </div>
              <div className="flex items-center gap-3 pt-5 border-t border-white/10">
                <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{t.initials}</div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-[11px] text-cream/60 flex items-center gap-1"><MapPin className="w-3 h-3" />{t.city} · Verified Patient</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-cream/60 mb-5 text-sm">Join thousands of satisfied patients on their wellness journey</p>
          <Link to="/shop" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-md font-medium hover:bg-primary/90 transition">
            Start Your Journey →
          </Link>
        </div>
      </div>
    </section>
  );
}
