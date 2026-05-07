export function CTA() {
  return (
    <section className="py-24 bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-dark-hero rounded-3xl p-10 sm:p-16 text-center text-cream overflow-hidden">
          <div className="absolute left-10 top-10 text-7xl opacity-10">🌿</div>
          <div className="absolute right-10 bottom-10 text-7xl opacity-10">🌿</div>
          <div className="relative">
            <div className="text-xs font-semibold text-primary-light tracking-[0.2em] uppercase mb-4">Get Started Today</div>
            <h2 className="font-display text-4xl sm:text-5xl mb-5">Start Your Wellness Journey</h2>
            <p className="text-cream/70 max-w-xl mx-auto mb-10">Join 10,000+ happy patients who have transformed their health with Shatakshi Herbal's premium Ayurvedic products.</p>
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {["✅ AYUSH Certified", "🌿 100% Natural", "🧪 Lab Tested", "👨‍⚕️ Doctor Formulated"].map(b => (
                <span key={b} className="bg-white/5 border border-white/15 rounded-full px-5 py-2.5 text-sm">{b}</span>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="bg-cream text-foreground px-8 py-4 rounded-md font-medium hover:bg-white transition">Explore All Products →</button>
              <button className="border border-cream/30 px-8 py-4 rounded-md font-medium hover:bg-white/5 transition">👨‍⚕️ Talk to Doctor</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
