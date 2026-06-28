import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, Loader2, Phone, KeyRound, Eye, EyeOff } from "lucide-react";
import { useAdminAuth } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin-login")({
  component: AdminLoginPage,
  head: () => ({
    meta: [
      { title: "Admin Sign In — Shatakshi Herbal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Tab = "password" | "otp";
type OtpStep = "phone" | "code";

function AdminLoginPage() {
  const navigate = useNavigate();
  const { admin, loading } = useAdminAuth();

  const [tab, setTab] = useState<Tab>("otp");
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const [otpStep, setOtpStep] = useState<OtpStep>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);

  useEffect(() => {
    if (!loading && admin) navigate({ to: "/admin", replace: true });
  }, [loading, admin, navigate]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username.trim().toLowerCase(), password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any)?.error ?? "Invalid credentials");
      }
      const data = await res.json();
      localStorage.setItem("admin_token", data.token);
      if (data.admin) localStorage.setItem("admin_data", JSON.stringify(data.admin));
      navigate({ to: "/admin", replace: true });
    } catch (err: any) {
      setError(err?.message || "Invalid credentials");
    } finally {
      setBusy(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone.trim() || phone.length < 10) return;
    setOtpBusy(true);
    try {
      const res = await fetch("/api/admin/otp-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setOtpStep("code");
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP. Please try again.");
    } finally {
      setOtpBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code.trim() || code.length < 6) return;
    setOtpBusy(true);
    try {
      const res = await fetch("/api/admin/otp-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      localStorage.setItem("admin_token", data.token);
      if (data.admin) localStorage.setItem("admin_data", JSON.stringify(data.admin));
      navigate({ to: "/admin", replace: true });
    } catch (err: any) {
      setError(err?.message || "Incorrect OTP. Please try again.");
      if (err?.message?.toLowerCase().includes("expired") || err?.message?.toLowerCase().includes("not found")) {
        setCode("");
      }
    } finally {
      setOtpBusy(false);
    }
  };

  const handleResend = () => {
    setOtpStep("phone");
    setCode("");
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream via-cream to-primary/5 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl text-foreground">Admin Sign In</h1>
          <p className="text-sm text-muted-foreground mt-1">Restricted Area — Authorized Personnel Only</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-7 border border-border/50 space-y-5">
          {/* Tab switcher */}
          <div className="flex rounded-xl border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => { setTab("otp"); setError(null); setOtpStep("phone"); setCode(""); }}
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition ${
                tab === "otp" ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground hover:bg-gray-50"
              }`}
            >
              <Phone className="w-4 h-4" />Phone OTP
            </button>
            <button
              type="button"
              onClick={() => { setTab("password"); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition ${
                tab === "password" ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground hover:bg-gray-50"
              }`}
            >
              <KeyRound className="w-4 h-4" />Password
            </button>
          </div>

          {/* Phone OTP tab */}
          {tab === "otp" && (
            <>
              {otpStep === "phone" ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Admin Mobile Number</label>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-3 py-2.5 border border-border rounded-xl text-sm text-muted-foreground bg-gray-50">
                        +91
                      </span>
                      <input
                        required
                        type="tel"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(null); }}
                        placeholder="10-digit mobile number"
                        autoComplete="tel"
                        maxLength={10}
                        inputMode="numeric"
                        className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  {error && (
                    <div className={`text-sm rounded-lg px-3 py-2 border ${error.toLowerCase().includes("denied") || error.toLowerCase().includes("authorized") ? "text-red-700 bg-red-50 border-red-200 font-medium" : "text-red-600 bg-red-50 border-red-200"}`}>
                      {error.toLowerCase().includes("denied") && "🚫 "}
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={otpBusy || phone.length < 10}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {otpBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                    {otpBusy ? "Sending OTP…" : "Send OTP"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Enter OTP</label>
                    <p className="text-xs text-muted-foreground mb-3">
                      A 6-digit code was sent to +91 {phone}
                    </p>
                    <input
                      required
                      type="text"
                      inputMode="numeric"
                      pattern="\d{6}"
                      value={code}
                      onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(null); }}
                      placeholder="6-digit OTP"
                      autoComplete="one-time-code"
                      maxLength={6}
                      autoFocus
                      className="w-full border border-border rounded-xl px-4 py-3 text-center tracking-[0.5em] font-mono text-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={otpBusy || code.length < 6}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {otpBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                    {otpBusy ? "Verifying…" : "Verify & Sign In"}
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    className="w-full text-sm text-muted-foreground hover:text-primary transition py-1"
                  >
                    Change number / Resend OTP
                  </button>
                </form>
              )}
            </>
          )}

          {/* Password tab */}
          {tab === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Username or Email</label>
                <input
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full border border-border rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign In
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Only authorized admin numbers can access this panel.
        </p>
      </div>
    </div>
  );
}
