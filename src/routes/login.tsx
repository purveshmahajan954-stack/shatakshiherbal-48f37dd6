import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Leaf, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

type LoginSearch = { redirect?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): LoginSearch => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign In — Shatakshi Herbal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { refreshUser, user } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    navigate({ to: (redirect as any) || "/" });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      localStorage.setItem("auth_token", data.token);
      await refreshUser();
      toast.success("Welcome back!");
      navigate({ to: (redirect as any) || "/" });
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
              <Leaf className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-3xl text-foreground">Welcome Back</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-7 border border-border/50">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign In
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-5">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
