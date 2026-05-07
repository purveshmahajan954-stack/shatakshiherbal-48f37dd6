import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, User, Sparkles } from "lucide-react";

export function Header() {
  return (
    <>
      <div className="bg-dark-green text-cream text-xs sm:text-sm py-3 px-4 text-center">
        <span className="inline-flex items-center gap-2 flex-wrap justify-center">
          <Sparkles className="w-3 h-3 text-primary-light" />
          <span className="font-medium tracking-wide">FREE SHIPPING ON ORDERS ABOVE ₹999</span>
          <span className="opacity-50">|</span>
          <span>USE CODE <span className="text-gold font-bold">HERBAL10</span> FOR 10% OFF</span>
          <Sparkles className="w-3 h-3 text-primary-light" />
        </span>
      </div>
      <header className="bg-cream/90 backdrop-blur sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div className="text-2xl">🌿</div>
              <div className="text-[10px] font-bold tracking-[0.2em] text-foreground leading-tight">SHATAKSHI</div>
              <div className="text-[8px] tracking-[0.3em] text-primary border-t border-primary pt-0.5">HERBAL</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-10">
            {[
              { label: "Home", to: "/" },
              { label: "About Us", to: "/about" },
              { label: "Shop", to: "/shop" },
              { label: "Product Info", to: "/product-info" },
              { label: "Contact", to: "/contact" },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors relative [&.active]:text-primary [&.active]:after:content-[''] [&.active]:after:absolute [&.active]:after:-bottom-1 [&.active]:after:left-0 [&.active]:after:w-full [&.active]:after:h-0.5 [&.active]:after:bg-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:text-primary transition-colors"><Search className="w-5 h-5" /></button>
            <button className="p-2 hover:text-primary transition-colors"><ShoppingBag className="w-5 h-5" /></button>
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 border-2 border-primary rounded-full text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-all">
              <User className="w-4 h-4" />Sign In
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
