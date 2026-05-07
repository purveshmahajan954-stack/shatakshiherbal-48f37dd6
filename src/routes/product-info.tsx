import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Blogs } from "@/components/Blogs";

export const Route = createFileRoute("/product-info")({
  component: ProductInfoPage,
  head: () => ({
    meta: [
      { title: "Product Info — Shatakshi Herbal" },
      { name: "description", content: "Learn about Ayurvedic herbs and our formulations." },
    ],
  }),
});

function ProductInfoPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="pt-8">
        <Blogs />
      </main>
      <Footer />
    </div>
  );
}
