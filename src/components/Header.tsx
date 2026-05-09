import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, User, Sparkles, Menu, X, Trash2, LogOut, Shield, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/about" },
  { label: "Shop", to: "/shop" },
  { label: "Product Info", to: "/product-info" },
  { label: "Contact", to: "/contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const { count, total, items, remove, clear } = useCart();
  const { user, isAdmin, signOut } = useAuth();

  const placeOrder = async () => {
    if (!user || items.length === 0) return;
    setPlacing(true);
    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      items: items as any,
      total,
    });
    setPlacing(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Order placed! We'll be in touch.");
    clear();
    setCartOpen(false);
  };

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
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <div className="flex flex-col items-center">
              <div className="text-2xl">🌿</div>
              <div className="text-[10px] font-bold tracking-[0.2em] text-foreground leading-tight">SHATAKSHI</div>
              <div className="text-[8px] tracking-[0.3em] text-primary border-t border-primary pt-0.5">HERBAL</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-10">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                activeOptions={{ exact: true }}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors relative [&.active]:text-primary [&.active]:after:content-[''] [&.active]:after:absolute [&.active]:after:-bottom-1 [&.active]:after:left-0 [&.active]:after:w-full [&.active]:after:h-0.5 [&.active]:after:bg-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <button aria-label="Search" onClick={() => toast("Search coming soon")} className="p-2 hover:text-primary transition-colors"><Search className="w-5 h-5" /></button>
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <button aria-label="Cart" className="relative p-2 hover:text-primary transition-colors">
                  <ShoppingBag className="w-5 h-5" />
                  {count > 0 && <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{count}</span>}
                </button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md flex flex-col">
                <SheetHeader>
                  <SheetTitle className="font-display text-2xl">Your Cart ({count})</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto py-4">
                  {items.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Your cart is empty</p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {items.map((i) => (
                        <li key={i.name} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{i.name}</div>
                            <div className="text-sm text-muted-foreground">₹{i.price} × {i.qty}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">₹{i.price * i.qty}</span>
                            <button onClick={() => remove(i.name)} aria-label={`Remove ${i.name}`} className="p-1.5 text-muted-foreground hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {items.length > 0 && (
                  <div className="border-t border-border pt-4 space-y-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span><span>₹{total}</span>
                    </div>
                    <button onClick={placeOrder} disabled={placing} className="w-full bg-primary text-primary-foreground py-3 rounded-full font-semibold hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2">
                      {placing && <Loader2 className="w-4 h-4 animate-spin" />}
                      {placing ? "Placing…" : "Place Order"}
                    </button>
                    <button onClick={clear} className="w-full text-sm text-muted-foreground hover:text-foreground">Clear cart</button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
            {isAdmin && (
              <Link to="/admin" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-gold/15 text-gold hover:bg-gold/25 transition">
                <Shield className="w-3.5 h-3.5" />Admin
              </Link>
            )}
            {user && (
              <button onClick={signOut} className="hidden sm:flex items-center gap-2 px-4 py-2 border-2 border-primary rounded-full text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-all">
                <LogOut className="w-4 h-4" />Sign Out
              </button>
            )}
            <button aria-label="Menu" onClick={() => setOpen(v => !v)} className="md:hidden p-2 text-foreground">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="md:hidden border-t border-border/50 bg-cream px-4 py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link key={item.label} to={item.to} onClick={() => setOpen(false)} className="py-2 text-sm font-medium text-foreground hover:text-primary">
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" onClick={() => setOpen(false)} className="py-2 text-sm font-semibold text-gold">Admin Panel</Link>
            )}
            {user ? (
              <button onClick={() => { signOut(); setOpen(false); }} className="py-2 text-sm font-medium text-primary text-left">Sign Out</button>
            ) : null}
          </nav>
        )}
      </header>
    </>
  );
}
