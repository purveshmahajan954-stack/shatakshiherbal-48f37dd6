import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FastImage } from "@/components/ui/fast-image";
import { useState } from "react";
import { Search, ShoppingBag, X } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CATEGORY_LABELS } from "@/lib/products";
import { useProducts } from "@/lib/use-products";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

type SearchParams = { q?: string };

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  head: ({ match }) => {
    const q = (match.search as SearchParams).q;
    return {
      meta: [
        { title: q ? `Search: "${q}" — Shatakshi Herbal` : "Search — Shatakshi Herbal" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const { add } = useCart();
  const [inputValue, setInputValue] = useState(q ?? "");
  const { items: products } = useProducts();

  const query = inputValue.trim().toLowerCase();

  const filtered = query
    ? products.filter((p) => {
        const categoryLabelMatch = p.categories.some((slug) => {
          const label = CATEGORY_LABELS[slug] ?? "";
          return label.toLowerCase().includes(query);
        });
        return (
          p.name.toLowerCase().includes(query) ||
          (p.desc ?? "").toLowerCase().includes(query) ||
          (p.longDesc ?? "").toLowerCase().includes(query) ||
          p.categories.some((c) => c.toLowerCase().includes(query)) ||
          categoryLabelMatch
        );
      })
    : products;

  const noResults = query.length > 0 && filtered.length === 0;
  const displayList = noResults ? products : filtered;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/search", search: inputValue.trim() ? { q: inputValue.trim() } : {} });
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-3xl sm:text-4xl mb-6">Search Products</h1>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search products, categories…"
              className="w-full pl-10 pr-10 py-2.5 border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => { setInputValue(""); navigate({ to: "/search" }); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition"
          >
            Search
          </button>
        </form>

        {/* Result count / status line */}
        <p className="text-sm text-muted-foreground mb-6">
          {noResults ? (
            <>
              <span className="text-destructive font-medium">No results for "{query}"</span>
              {" "}— showing all {products.length} products
            </>
          ) : query ? (
            <>{filtered.length} result{filtered.length === 1 ? "" : "s"} for <span className="font-semibold text-foreground">"{query}"</span></>
          ) : (
            <>All {products.length} products</>
          )}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayList.map((p) => (
            <article key={p.slug} className="bg-white rounded-2xl overflow-hidden shadow-card group">
              <Link to="/product/$slug" params={{ slug: p.slug }} className="block bg-accent/30 relative">
                {p.badge && (
                  <span className={`absolute top-2 left-2 text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                )}
                <FastImage src={p.image} alt={p.name} wrapperClassName="group-hover:scale-105 transition-transform duration-500" />
              </Link>
              <div className="p-4">
                <Link to="/product/$slug" params={{ slug: p.slug }}>
                  <h3 className="font-display text-base font-semibold mb-1 hover:text-primary transition leading-snug">{p.name}</h3>
                </Link>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{p.desc}</p>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-foreground">₹{p.price}</span>
                  </div>
                  <button
                    onClick={() => {
                      add({ name: p.name, price: p.price, image: p.image, slug: p.slug });
                      toast.success(`${p.name} added to cart`);
                    }}
                    className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-semibold hover:opacity-90 transition"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
