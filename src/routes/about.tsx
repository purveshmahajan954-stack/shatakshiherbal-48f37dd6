import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AyurvedicWisdom } from "@/components/AyurvedicWisdom";
import { Testimonials } from "@/components/Testimonials";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About Us — Shatakshi Herbal" },
      { name: "description", content: "5,000 years of Ayurvedic wisdom, reimagined." },
    ],
  }),
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main>
        <AyurvedicWisdom />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
