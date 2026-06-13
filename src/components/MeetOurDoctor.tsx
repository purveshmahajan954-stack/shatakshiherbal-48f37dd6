import { MapPin, Phone, Star, Stethoscope, Quote } from "lucide-react";

export function MeetOurDoctor() {
  return (
    <section className="bg-[#f9f5ef] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase border border-primary/30 rounded-full px-4 py-1.5 mb-4">
            <Stethoscope className="w-3.5 h-3.5" /> Expert Formulation
          </span>
          <h2 className="font-display text-4xl lg:text-5xl text-foreground leading-tight">
            Meet Our <span className="italic text-gradient-green">Doctor</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            Every Shatakshi Herbal formulation is reviewed and guided by an experienced Ayurvedic physician.
          </p>
        </div>

        <div className="bg-white rounded-3xl overflow-hidden shadow-soft lg:grid lg:grid-cols-5 max-w-5xl mx-auto">
          <div className="lg:col-span-2 flex flex-col items-center justify-center py-12 px-8 border-b border-border lg:border-b-0 lg:border-r bg-accent/30">
            <div className="relative">
              <div className="w-40 h-40 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-lg">
                <img src="/testimonial-person.jpeg" alt="Dr. Suneel Katiya" className="w-full h-full object-cover object-top" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white rounded-xl px-3 py-1.5 flex items-center gap-1 shadow-md border border-border">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-sm text-foreground">4.7</span>
                <span className="text-xs text-muted-foreground">(88)</span>
              </div>
            </div>

            <h3 className="mt-6 font-display text-2xl text-foreground text-center">Dr. Suneel Katiya</h3>
            <p className="text-primary text-sm font-medium mt-1 text-center">B.A.M.S, M.D.</p>
            <p className="text-muted-foreground text-xs mt-1 text-center">Diabetes Center · Ayurvedic Medicine</p>

            <div className="mt-8 flex flex-col gap-3 w-full">
              <a
                href="tel:+919754468444"
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl px-5 py-3 text-sm font-semibold transition w-full"
              >
                <Phone className="w-4 h-4" /> +91 97544 68444
              </a>
              <a
                href="https://maps.google.com/?q=By-pass+Road+near+Chitragupt+School+Gadarwara+Madhya+Pradesh"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border border-border hover:bg-accent/50 text-foreground rounded-xl px-5 py-3 text-sm font-medium transition w-full"
              >
                <MapPin className="w-4 h-4 text-primary" /> Get Directions
              </a>
            </div>
          </div>

          <div className="lg:col-span-3 py-12 px-8 lg:px-10 flex flex-col justify-between gap-8">
            <div>
              <h4 className="font-display text-xl text-foreground mb-3">About the Doctor</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Dr. Suneel Katiya is a certified Ayurvedic physician with over 15 years of clinical experience specialising in diabetes management and metabolic disorders through natural remedies. He has been instrumental in formulating Shatakshi Herbal's product range, ensuring each preparation adheres to classical Ayurvedic principles while meeting modern therapeutic standards.
              </p>
            </div>

            <div className="bg-accent/40 border border-border rounded-2xl p-6 relative">
              <Quote className="w-8 h-8 text-primary/30 absolute -top-3 -left-1" />
              <p className="font-display text-lg italic text-foreground leading-relaxed">
                "Ayurveda is not just medicine — it is a way of living in harmony with nature. True healing begins when we treat the root cause, not merely the symptom."
              </p>
              <p className="mt-3 text-primary text-xs font-semibold">— Dr. Suneel Katiya</p>
            </div>

            <div className="flex items-start gap-3 text-muted-foreground text-xs leading-relaxed">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
              <span>By-pass Road, near Chitragupt School, Shivaji Ward, Gadarwara, Madhya Pradesh 487551</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
