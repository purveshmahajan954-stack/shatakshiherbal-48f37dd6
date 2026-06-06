import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Leaf, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Account — Shatakshi Herbal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { refreshUser, user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    navigate({ to: "/" });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName: name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      localStorage.setItem("auth_token", data.token);
      await refreshUser();
      toast.success("Account created! Welcome to Shatakshi Herbal.");
      navigate({ to: "/" });
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
            <h1 className="font-display text-3xl text-foreground">Create Account</h1>
            <p className="text-sm text-muted-foreground mt-1">Join Shatakshi Herbal today</p>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-7 border border-border/50">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
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
                  minLength={6}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Confirm Password</label>
                <input
                  required
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                    confirm && confirm !== password ? "border-red-400 focus:ring-red-400" : "border-border"
                  }`}
                />
                {confirm && confirm !== password && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
              <button
                type="submit"
                disabled={busy || (!!confirm && confirm !== password)}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Account
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-5">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
