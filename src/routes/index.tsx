import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";

const Categories = lazy(() => import("@/components/Categories").then(m => ({ default: m.Categories })));
const FeaturedProducts = lazy(() => import("@/components/FeaturedProducts").then(m => ({ default: m.FeaturedProducts })));
const AyurvedicWisdom = lazy(() => import("@/components/AyurvedicWisdom").then(m => ({ default: m.AyurvedicWisdom })));
const Blogs = lazy(() => import("@/components/Blogs").then(m => ({ default: m.Blogs })));
const Testimonials = lazy(() => import("@/components/Testimonials").then(m => ({ default: m.Testimonials })));
const CTA = lazy(() => import("@/components/CTA").then(m => ({ default: m.CTA })));
const Footer = lazy(() => import("@/components/Footer").then(m => ({ default: m.Footer })));

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Shatakshi Herbal — Pure Ayurvedic Healing for Modern Life" },
      { name: "description", content: "Premium Ayurvedic formulations crafted from nature's finest ingredients. AYUSH certified, 100% natural herbal medicines." },
    ],
    links: [
      { rel: "preload", as: "image", href: "/src/assets/hero-slide-1.webp", fetchpriority: "high" },
    ],
  }),
});

function Index() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main>
        <Hero />
        <Suspense fallback={<div className="h-32" />}>
          <Categories />
          <FeaturedProducts />
          <AyurvedicWisdom />
          <Blogs />
          <Testimonials />
          <CTA />
        </Suspense>
      </main>
      <Suspense fallback={null}><Footer /></Suspense>
    </div>
  );
}
