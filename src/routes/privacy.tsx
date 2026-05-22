import { createFileRoute } from "@tanstack/react-router";
import { PolicyLayout } from "@/components/PolicyLayout";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — Shatakshi Herbal" },
      { name: "description", content: "How Shatakshi Herbal collects, uses, and protects your personal information." },
    ],
  }),
});

function PrivacyPage() {
  return (
    <PolicyLayout title="Privacy Policy" updated="22 May 2026">
      <p>At Shatakshi Herbal ("we", "us", "our"), your privacy is important to us. This Privacy Policy explains what information we collect, how we use it, and the choices you have when you use our website and services.</p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li><strong>Personal details</strong> you share: name, email, phone, shipping address.</li>
        <li><strong>Order information</strong>: products purchased, payment status, delivery preferences.</li>
        <li><strong>Account data</strong>: login email and authentication details.</li>
        <li><strong>Usage data</strong>: pages visited, device, browser, and approximate location for analytics.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To process and deliver your orders.</li>
        <li>To respond to your queries and customer support requests.</li>
        <li>To send order updates, invoices, and important notices.</li>
        <li>To improve our website, products, and overall customer experience.</li>
        <li>To send promotional offers, only if you have opted in.</li>
      </ul>

      <h2>3. Sharing of Information</h2>
      <p>We do not sell your personal data. We share limited information only with trusted partners such as courier companies, payment gateways, and analytics providers strictly to fulfil your order or operate the website.</p>

      <h2>4. Data Security</h2>
      <p>We use industry-standard safeguards including encrypted connections (HTTPS) and secure storage to protect your information. However, no method of transmission over the internet is 100% secure.</p>

      <h2>5. Cookies</h2>
      <p>We use cookies to remember your cart, login session, and to understand site usage. You can disable cookies in your browser settings, but some features may not work as expected.</p>

      <h2>6. Your Rights</h2>
      <p>You may request access, correction, or deletion of your personal data by writing to us at <a href="mailto:sunil.katiya06@gmail.com">sunil.katiya06@gmail.com</a>.</p>

      <h2>7. Contact Us</h2>
      <p>Shatakshi Herbal<br/>By-pass Road, near Chitragupt school, Shivaji Ward, Gadarwara, Madhya Pradesh 487551<br/>Email: sunil.katiya06@gmail.com<br/>Phone: +91 97544 68444</p>
    </PolicyLayout>
  );
}
