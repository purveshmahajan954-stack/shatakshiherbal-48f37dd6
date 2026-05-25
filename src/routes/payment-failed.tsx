import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { XCircle, RotateCcw, ShoppingBag } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/payment-failed")({
  validateSearch: z.object({
    r: z.string().optional(),
    reason: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Payment Failed — Shatakshi Herbal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FailedPage,
});

function FailedPage() {
  const { reason } = Route.useSearch();
  const friendly =
    reason === "dismissed"
      ? "You closed the payment window before completing the transaction."
      : reason ?? "Your payment could not be processed.";

  return (
    <div className="min-h-screen flex flex-col bg-cream/40">
      <Header />
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-16">
        <div className="bg-white rounded-2xl shadow-card p-8 sm:p-12 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-5">
            <XCircle className="w-12 h-12 text-destructive" />
          </div>
          <h1 className="font-display text-3xl mb-2">Payment Failed</h1>
          <p className="text-muted-foreground mb-1">{friendly}</p>
          <p className="text-xs text-muted-foreground mb-8">No amount has been deducted. If it was, it will be refunded within 5–7 business days.</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/checkout" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:opacity-90">
              <RotateCcw className="w-4 h-4" /> Retry Payment
            </Link>
            <Link to="/cart" className="inline-flex items-center justify-center gap-2 border border-border px-6 py-3 rounded-full font-semibold hover:bg-cream">
              <ShoppingBag className="w-4 h-4" /> Back to Cart
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
