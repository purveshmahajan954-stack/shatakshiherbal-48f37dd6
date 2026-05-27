import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin-login")({
  component: AdminLoginPage,
  head: () => ({
    meta: [
      { title: "Admin Login — Shatakshi Herbal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const ADMIN_USERNAME = "shatakshiherbal";
const ADMIN_PASSWORD = "shatakshiherbal12345";

function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // If already authed, jump straight to /admin
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("admin_auth") === "true") {
      navigate({ to: "/admin", replace: true });
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem("admin_auth", "true");
      navigate({ to: "/admin", replace: true });
    } else {
      alert("Invalid username or password");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream via-cream to-primary/5 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl text-foreground">Admin Login</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Restricted area — authorized personnel only
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-card p-7 border border-border/50 space-y-4"
        >
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1.5">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
