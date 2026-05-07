import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Categories } from "@/components/Categories";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { AyurvedicWisdom } from "@/components/AyurvedicWisdom";
import { Blogs } from "@/components/Blogs";
import { Testimonials } from "@/components/Testimonials";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Shatakshi Herbal — Pure Ayurvedic Healing for Modern Life" },
      { name: "description", content: "Premium Ayurvedic formulations crafted from nature's finest ingredients. AYUSH certified, 100% natural herbal medicines." },
    ],
  }),
});

function Index() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main>
        <Hero />
        <Categories />
        <FeaturedProducts />
        <AyurvedicWisdom />
        <Blogs />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
