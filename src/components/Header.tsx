import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Menu, X, Trash2, LogOut, Shield, Package, ArrowRight, Heart, Search, LogIn, UserCircle } from "lucide-react";
import { useState, useRef } from "react";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useAuth } from "@/lib/auth";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import logoImg from "@/assets/logo.png";

const navItems = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/about" },
  { label: "Shop", to: "/shop" },
  { label: "Our Certifications", to: "/product-info" },
  { label: "Contact", to: "/contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { count, total, items, remove, clear } = useCart();
  const { count: wishCount } = useWishlist();
  const { user, isAdmin, signOut, loading } = useAuth();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate({ to: "/search", search: { q } });
    setSearchOpen(false);
    setOpen(false);
  };

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  return (
    <>
      <header className="bg-cream/90 backdrop-blur sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-7xl mx-auto pl-1 pr-4 sm:pl-2 sm:pr-6 lg:pl-3 lg:pr-8 flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0" onClick={() => setOpen(false)}>
            <img
              src={logoImg}
              alt="Shatakshi Herbal"
              className="h-14 w-auto object-contain"
              style={{ maxWidth: "160px" }}
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
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

          {/* Right-side icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search bar — desktop */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center">
              {searchOpen ? (
                <div className="flex items-center gap-1 border border-border rounded-full bg-white px-3 py-1.5">
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products…"
                    className="w-44 text-sm bg-transparent focus:outline-none"
                    onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                    onKeyDown={(e) => { if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); } }}
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openSearch}
                  aria-label="Search"
                  className="p-2 hover:text-primary transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </form>

            {/* Wishlist */}
            <Link to="/wishlist" aria-label="Wishlist" className="relative p-2 hover:text-primary transition-colors">
              <Heart className="w-5 h-5" />
              {wishCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {wishCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <button aria-label="Cart" className="relative p-2 hover:text-primary transition-colors">
                  <ShoppingBag className="w-5 h-5" />
                  {count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {count}
                    </span>
                  )}
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
                      <span>Subtotal</span><span>₹{total}</span>
                    </div>
                    <Link to="/checkout" onClick={() => setCartOpen(false)} className="w-full bg-primary text-primary-foreground py-3 rounded-full font-semibold hover:opacity-90 transition inline-flex items-center justify-center gap-2">
                      Checkout <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link to="/cart" onClick={() => setCartOpen(false)} className="w-full block text-center text-sm text-muted-foreground hover:text-foreground">View full cart</Link>
                    <button onClick={clear} className="w-full text-sm text-muted-foreground hover:text-foreground">Clear cart</button>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            {/* My Account (logged in) */}
            {user && (
              <Link to="/account" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-foreground hover:bg-accent transition">
                <UserCircle className="w-3.5 h-3.5" />My Account
              </Link>
            )}

            {/* Admin link */}
            {isAdmin && (
              <Link to="/admin" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-gold/15 text-gold hover:bg-gold/25 transition">
                <Shield className="w-3.5 h-3.5" />Admin
              </Link>
            )}

            {/* Auth button */}
            {!loading && (
              user ? (
                <button
                  onClick={signOut}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 border-2 border-primary rounded-full text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  <LogOut className="w-4 h-4" />Sign Out
                </button>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:opacity-90 transition"
                >
                  <LogIn className="w-4 h-4" />Login
                </Link>
              )
            )}

            {/* Mobile menu button */}
            <button aria-label="Menu" onClick={() => setOpen(v => !v)} className="md:hidden p-2 text-foreground">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <nav className="md:hidden border-t border-border/50 bg-cream px-4 py-4 flex flex-col gap-2">
            {/* Mobile search */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 mb-2">
              <div className="flex-1 flex items-center gap-2 border border-border rounded-full bg-white px-3 py-2">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products…"
                  className="flex-1 text-sm bg-transparent focus:outline-none"
                />
              </div>
              <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold">
                Go
              </button>
            </form>

            {navItems.map((item) => (
              <Link key={item.label} to={item.to} onClick={() => setOpen(false)} className="py-2 text-sm font-medium text-foreground hover:text-primary">
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" onClick={() => setOpen(false)} className="py-2 text-sm font-semibold text-gold">Admin Panel</Link>
            )}
            {user ? (
              <>
                <Link to="/account" onClick={() => setOpen(false)} className="py-2 text-sm font-medium text-foreground hover:text-primary">My Account</Link>
                <button onClick={() => { signOut(); setOpen(false); }} className="py-2 text-sm font-medium text-primary text-left">Sign Out</button>
              </>
            ) : (
              <div className="flex gap-3 pt-2">
                <Link to="/login" onClick={() => setOpen(false)} className="flex-1 text-center py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold">Login</Link>
                <Link to="/signup" onClick={() => setOpen(false)} className="flex-1 text-center py-2 border border-primary text-primary rounded-full text-sm font-semibold">Sign Up</Link>
              </div>
            )}
          </nav>
        )}
      </header>
    </>
  );
}
