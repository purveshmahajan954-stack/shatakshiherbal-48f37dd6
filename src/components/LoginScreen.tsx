import { useState } from "react";
import { toast } from "sonner";
import { Leaf, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function LoginScreen({ title, subtitle }: { title?: string; subtitle?: string } = {}) {
  const { refreshUser } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/signin";
      const body =
        mode === "signup"
          ? { email, password, fullName: name }
          : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      localStorage.setItem("auth_token", data.token);
      await refreshUser();
      toast.success(mode === "signup" ? "Account created! Welcome." : "Welcome back!");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream via-cream to-primary/5 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <Leaf className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl text-foreground">{title ?? "Shatakshi Herbal"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {subtitle ?? (mode === "signin" ? "Sign in to continue" : "Create your account")}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-7 border border-border/50">
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            )}
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              required
              minLength={6}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 chars)"
              className="w-full border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            {mode === "signin" ? "New here? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-primary font-medium hover:underline"
            >
              {mode === "signin" ? "Create account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
