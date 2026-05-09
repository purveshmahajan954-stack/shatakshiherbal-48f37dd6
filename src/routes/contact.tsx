import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState } from "react";
import { Mail, Phone, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact — Shatakshi Herbal" },
      { name: "description", content: "Get in touch with Shatakshi Herbal." },
    ],
  }),
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      message: form.message.trim(),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    setForm({ name: "", email: "", phone: "", message: "" });
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-sm font-semibold text-primary-light tracking-[0.2em] uppercase mb-3">Get in Touch</div>
            <h1 className="font-display text-4xl sm:text-5xl text-foreground mb-4">Contact Us</h1>
            <p className="text-muted-foreground">We'd love to hear from you. Send us a message.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Mail, label: "Email", value: "hello@shatakshi.com" },
              { icon: Phone, label: "Phone", value: "+91 98765 43210" },
              { icon: MapPin, label: "Address", value: "Mumbai, India" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white p-6 rounded-2xl shadow-card text-center">
                <Icon className="w-6 h-6 text-primary mx-auto mb-3" />
                <div className="font-semibold">{label}</div>
                <div className="text-sm text-muted-foreground mt-1">{value}</div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-card max-w-2xl mx-auto space-y-4">
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="w-full border border-border rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary" />
            <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email address" className="w-full border border-border rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary" />
            <textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Your message" className="w-full border border-border rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary" />
            <button type="submit" className="bg-primary text-primary-foreground px-8 py-3 rounded-md font-medium hover:bg-primary/90 transition">Send Message</button>
            {sent && <p className="text-primary text-sm">Thanks! We'll get back to you soon.</p>}
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
