import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState } from "react";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
  head: () => ({
    meta: [
      { title: "Sign In — Shatakshi Herbal" },
      { name: "description", content: "Sign in to your Shatakshi Herbal account." },
    ],
  }),
});

function SignInPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="py-20">
        <div className="max-w-md mx-auto px-4">
          <h1 className="font-display text-4xl text-center mb-8">Sign In</h1>
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-card space-y-4">
            <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full border border-border rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary" />
            <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" className="w-full border border-border rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary" />
            <button type="submit" className="w-full bg-primary text-primary-foreground py-3 rounded-md font-medium hover:bg-primary/90 transition">Sign In</button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
