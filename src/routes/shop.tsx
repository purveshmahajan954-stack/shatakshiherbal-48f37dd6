import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Categories, categories } from "@/components/Categories";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { ArrowLeft, Package } from "lucide-react";

type ShopSearch = { cat?: string; q?: string };

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    cat: typeof search.cat === "string" ? search.cat : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: ShopPage,
  head: () => ({
    meta: [
      { title: "Shop — Shatakshi Herbal" },
      { name: "description", content: "Browse our premium Ayurvedic products." },
    ],
  }),
});

function CategoryHero({ slug }: { slug: string }) {
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) return null;
  return (
    <section
      className="py-12 sm:py-16"
      style={{ backgroundColor: cat.bg }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> All Categories
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div
            className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center text-5xl shadow-md flex-shrink-0"
          >
            {cat.icon}
          </div>
          <div className="flex-1">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3"
              style={{ backgroundColor: "rgba(255,255,255,0.6)", color: cat.chip }}
            >
              <Package className="w-3.5 h-3.5" />
              {cat.count} Products
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-foreground leading-tight mb-2">
              {cat.name}
            </h1>
            <p className="text-foreground/70 text-base">{cat.desc}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ShopPage() {
  const { cat } = useSearch({ from: "/shop" });

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="pt-8">
        {cat ? (
          <>
            <CategoryHero slug={cat} />
            <FeaturedProducts />
          </>
        ) : (
          <>
            <Categories />
            <FeaturedProducts />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
