import { createFileRoute } from "@tanstack/react-router";
import { PolicyLayout } from "@/components/PolicyLayout";

export const Route = createFileRoute("/refund")({
  component: RefundPage,
  head: () => ({
    meta: [
      { title: "Refund & Cancellation Policy — Shatakshi Herbal" },
      { name: "description", content: "Our refund, return, and cancellation policy for Shatakshi Herbal orders." },
    ],
  }),
});

function RefundPage() {
  return (
    <PolicyLayout title="Refund & Cancellation Policy" updated="22 May 2026">
      <p>We want you to be completely satisfied with your purchase. This policy explains how cancellations, returns, and refunds work.</p>

      <h2>1. Order Cancellation</h2>
      <ul>
        <li>Orders can be cancelled within <strong>12 hours</strong> of placing them, provided they have not been dispatched.</li>
        <li>To cancel, email <a href="mailto:sunil.katiya06@gmail.com">sunil.katiya06@gmail.com</a> or WhatsApp +91 97544 68444 with your order ID.</li>
        <li>Once an order has been shipped, it cannot be cancelled.</li>
      </ul>

      <h2>2. Returns & Replacements</h2>
      <ul>
        <li>We accept returns only for products that arrive <strong>damaged, defective, or incorrect</strong>.</li>
        <li>Report the issue within <strong>48 hours</strong> of delivery with clear photos/video of the package and product.</li>
        <li>Due to the nature of Ayurvedic and consumable products, opened or used items cannot be returned for hygiene and safety reasons.</li>
      </ul>

      <h2>3. Refund Process</h2>
      <ul>
        <li>Once your return/claim is approved, the refund will be initiated to the original payment method.</li>
        <li>Refunds typically reflect within <strong>5–7 business days</strong>, depending on your bank or payment provider.</li>
        <li>For prepaid orders cancelled before dispatch, the full amount is refunded.</li>
      </ul>

      <h2>4. Non-Refundable Items</h2>
      <ul>
        <li>Products bought during clearance, combo offers, or flash sales (unless damaged/defective).</li>
        <li>Items returned without prior approval or without original packaging.</li>
      </ul>

      <h2>5. Contact Us</h2>
      <p>For any cancellation, return, or refund query, reach us at <a href="mailto:sunil.katiya06@gmail.com">sunil.katiya06@gmail.com</a> or +91 97544 68444.</p>
    </PolicyLayout>
  );
}
