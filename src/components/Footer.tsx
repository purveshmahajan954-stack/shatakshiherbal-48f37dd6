import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";

const Instagram = (p: { className?: string }) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>);
const Facebook = (p: { className?: string }) => (<svg viewBox="0 0 24 24" fill="currentColor" className={p.className}><path d="M13 22v-8h2.7l.4-3H13V9c0-.9.3-1.5 1.6-1.5H16V4.8C15.7 4.8 14.7 4.7 13.6 4.7c-2.3 0-3.9 1.4-3.9 4V11H7v3h2.7v8H13z"/></svg>);
const Youtube = (p: { className?: string }) => (<svg viewBox="0 0 24 24" fill="currentColor" className={p.className}><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8C22 15.2 22 12 22 12s0-3.2-.4-4.8zM10 15V9l5 3-5 3z"/></svg>);
const MessageCircle = (p: { className?: string }) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/></svg>);

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
