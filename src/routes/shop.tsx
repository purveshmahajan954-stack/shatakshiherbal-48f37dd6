import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Categories } from "@/components/Categories";
import { FeaturedProducts } from "@/components/FeaturedProducts";

export const Route = createFileRoute("/shop")({
  component: ShopPage,
  head: () => ({
    meta: [
      { title: "Shop — Shatakshi Herbal" },
      { name: "description", content: "Browse our premium Ayurvedic products." },
    ],
  }),
});

function ShopPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="pt-8">
        <Categories />
        <FeaturedProducts />
      </main>
      <Footer />
    </div>
  );
}
