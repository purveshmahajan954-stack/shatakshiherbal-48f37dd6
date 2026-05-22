import { createFileRoute } from "@tanstack/react-router";
import { PolicyLayout } from "@/components/PolicyLayout";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Shatakshi Herbal" },
      { name: "description", content: "Terms and conditions for using the Shatakshi Herbal website and purchasing our products." },
    ],
  }),
});

function TermsPage() {
  return (
    <PolicyLayout title="Terms & Conditions" updated="22 May 2026">
      <p>Welcome to Shatakshi Herbal. By accessing or using our website, you agree to be bound by these Terms & Conditions. Please read them carefully.</p>

      <h2>1. Use of the Website</h2>
      <p>You agree to use this website only for lawful purposes and in a manner that does not infringe the rights of, or restrict the use of, any other person or entity.</p>

      <h2>2. Product Information</h2>
      <p>We make every effort to display product details, images, and prices accurately. However, slight variations in colour, packaging, or composition may occur. All Ayurvedic products are intended as wellness supplements and are not a substitute for medical advice.</p>

      <h2>3. Pricing & Payment</h2>
      <ul>
        <li>All prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise.</li>
        <li>We reserve the right to change prices at any time without prior notice.</li>
        <li>Payment must be completed in full before an order is processed.</li>
      </ul>

      <h2>4. Account & Orders</h2>
      <p>You are responsible for maintaining the confidentiality of your account credentials. We reserve the right to cancel or refuse any order at our discretion, including in cases of suspected fraud or stock unavailability.</p>

      <h2>5. Intellectual Property</h2>
      <p>All content on this website — including logos, text, images, and product designs — is the property of Shatakshi Herbal and may not be reproduced without written permission.</p>

      <h2>6. Limitation of Liability</h2>
      <p>Shatakshi Herbal shall not be liable for any indirect, incidental, or consequential damages arising from the use or inability to use our website or products. Always consult a qualified physician before starting any new supplement, especially if pregnant, nursing, or on medication.</p>

      <h2>7. Governing Law</h2>
      <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Gadarwara, Madhya Pradesh.</p>

      <h2>8. Contact</h2>
      <p>For questions about these Terms, email <a href="mailto:sunil.katiya06@gmail.com">sunil.katiya06@gmail.com</a> or call +91 97544 68444.</p>
    </PolicyLayout>
  );
}
