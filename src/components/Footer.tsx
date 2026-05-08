import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Youtube, MessageCircle, Leaf } from "lucide-react";

const badges = [
  { icon: "🌿", label: "AYUSH Certified" },
  { icon: "🧪", label: "Lab Tested" },
  { icon: "✅", label: "100% Natural" },
  { icon: "🚚", label: "Free Shipping ₹999+" },
];

const footerLinks = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Talk to Doctor", to: "/contact" },
] as const;

const socials = [
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
  { icon: MessageCircle, href: "https://wa.me/910000000000", label: "WhatsApp" },
];

export function Footer() {
  return (
    <footer className="bg-dark-hero text-cream/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="flex flex-col items-center">
            <div className="text-4xl">🌿</div>
            <div className="text-sm font-bold tracking-[0.3em] text-cream mt-1">SHATAKSHI</div>
            <div className="text-[10px] tracking-[0.4em] text-cream/70 border-t border-cream/40 pt-1 mt-0.5">HERBAL</div>
          </Link>

          <p className="mt-8 font-display italic text-cream/70 max-w-md text-lg leading-relaxed">
            "Pure Ayurvedic wellness, rooted in 5,000 years of ancient wisdom."
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {badges.map((b) => (
              <span key={b.label} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cream/15 bg-cream/5 text-xs sm:text-sm text-cream/80">
                <span>{b.icon}</span>{b.label}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-cream/10 mt-12 pt-10 flex flex-col items-center gap-8">
          <nav className="flex flex-wrap justify-center gap-x-10 gap-y-3">
            {footerLinks.map((l) => (
              <Link key={l.label} to={l.to} className="text-sm text-cream/80 hover:text-cream transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                className="w-10 h-10 rounded-full border border-cream/15 bg-cream/5 flex items-center justify-center text-cream/80 hover:text-cream hover:border-cream/40 transition-all">
                <s.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="border-t border-cream/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cream/60">
          <div>© {new Date().getFullYear()} Shatakshi Herbal Pvt. Ltd. All rights reserved.</div>
          <div className="inline-flex items-center gap-1.5">Made with <Leaf className="w-3.5 h-3.5 text-primary-light" /> in India</div>
        </div>
      </div>
    </footer>
  );
}
