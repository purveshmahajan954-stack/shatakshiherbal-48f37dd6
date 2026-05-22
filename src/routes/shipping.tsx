import { createFileRoute } from "@tanstack/react-router";
import { PolicyLayout } from "@/components/PolicyLayout";

export const Route = createFileRoute("/shipping")({
  component: ShippingPage,
  head: () => ({
    meta: [
      { title: "Shipping & Delivery Policy — Shatakshi Herbal" },
      { name: "description", content: "Shipping timelines, charges, and delivery information for Shatakshi Herbal orders." },
    ],
  }),
});

function ShippingPage() {
  return (
    <PolicyLayout title="Shipping & Delivery Policy" updated="22 May 2026">
      <p>We ship Shatakshi Herbal products across India through trusted courier partners. Here's what you can expect.</p>

      <h2>1. Order Processing</h2>
      <ul>
        <li>Orders are processed within <strong>1–2 business days</strong> of payment confirmation.</li>
        <li>Orders placed on Sundays or public holidays are processed the next working day.</li>
      </ul>

      <h2>2. Delivery Timelines</h2>
      <ul>
        <li><strong>Metro cities:</strong> 3–5 business days</li>
        <li><strong>Other locations:</strong> 5–8 business days</li>
        <li><strong>Remote areas:</strong> 7–10 business days</li>
      </ul>
      <p>Delivery times are indicative and may vary due to courier delays, weather, or unforeseen circumstances.</p>

      <h2>3. Shipping Charges</h2>
      <ul>
        <li><strong>Free shipping</strong> on all prepaid orders above ₹999.</li>
        <li>Orders below ₹999 may attract a nominal shipping fee shown at checkout.</li>
        <li>Cash on Delivery (where available) may include a small handling fee.</li>
      </ul>

      <h2>4. Order Tracking</h2>
      <p>Once your order is dispatched, you will receive a tracking link via email/SMS/WhatsApp. You can also contact us anytime for tracking assistance.</p>

      <h2>5. Undeliverable / Returned Shipments</h2>
      <p>If a package is returned to us due to an incorrect address, unavailability, or refusal to accept delivery, we will contact you to arrange re-shipment (additional charges may apply) or a refund minus shipping costs.</p>

      <h2>6. International Shipping</h2>
      <p>Currently, we ship only within India. For bulk or international enquiries, please email <a href="mailto:sunil.katiya06@gmail.com">sunil.katiya06@gmail.com</a>.</p>

      <h2>7. Need Help?</h2>
      <p>Email <a href="mailto:sunil.katiya06@gmail.com">sunil.katiya06@gmail.com</a> or WhatsApp +91 97544 68444 — we're happy to help.</p>
    </PolicyLayout>
  );
}
