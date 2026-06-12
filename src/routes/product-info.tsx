import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/product-info")({
  component: ProductInfoPage,
  head: () => ({
    meta: [
      { title: "Our Certifications — Shatakshi Herbal" },
      { name: "description", content: "Learn about Ayurvedic herbs and our formulations." },
    ],
  }),
});

function ProductInfoPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="flex flex-col items-center justify-center py-32 px-4 text-center">
        <BookOpen className="w-14 h-14 text-primary mb-6 opacity-60" />
        <h1 className="font-display text-3xl sm:text-4xl mb-3">Our Certifications</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          Our blog articles and Ayurvedic guides have moved to the About Us page.
        </p>
        <Link
          to="/about"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:opacity-90 transition"
        >
          Read our blogs →
        </Link>
      </main>
      <Footer />
    </div>
  );
}
