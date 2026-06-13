import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Shield, Loader2, Phone, KeyRound } from "lucide-react";
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

  // Password tab
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // OTP tab
  const [otpStep, setOtpStep] = useState<OtpStep>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const confirmationRef = useRef<any>(null);

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
      setBusy(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone.trim()) return;
    setOtpBusy(true);
    try {
      const { sendPhoneOtp } = await import("@/lib/firebase");
      confirmationRef.current = await sendPhoneOtp(phone.trim(), "admin-recaptcha-container");
      setOtpStep("code");
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP. Please try again.");
      const { clearRecaptcha } = await import("@/lib/firebase");
      clearRecaptcha();
    } finally {
      setOtpBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code.trim() || !confirmationRef.current) return;
    setOtpBusy(true);
    try {
      const { confirmPhoneOtp } = await import("@/lib/firebase");
      const idToken = await confirmPhoneOtp(confirmationRef.current, code.trim());

      const res = await fetch("/api/admin/firebase-phone-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      localStorage.setItem("admin_token", data.token);
      if (data.admin) localStorage.setItem("admin_data", JSON.stringify(data.admin));
      navigate({ to: "/admin", replace: true });
    } catch (err: any) {
      setError(err?.message || "Invalid OTP or not authorized.");
      if (err?.message?.toLowerCase().includes("invalid") || err?.message?.toLowerCase().includes("expired")) {
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
    confirmationRef.current = null;
    import("@/lib/firebase").then(({ clearRecaptcha }) => clearRecaptcha());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream via-cream to-primary/5 px-4 py-10">
      <div id="admin-recaptcha-container" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl text-foreground">Admin Sign In</h1>
          <p className="text-sm text-muted-foreground mt-1">Restricted Area</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-7 border border-border/50 space-y-5">
          {/* Tab switcher */}
          <div className="flex rounded-xl border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => { setTab("otp"); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition ${
                tab === "otp"
                  ? "bg-primary text-primary-foreground"
                  : "bg-white text-muted-foreground hover:bg-gray-50"
              }`}
            >
              <Phone className="w-4 h-4" />
              Phone OTP
            </button>
            <button
              type="button"
              onClick={() => { setTab("password"); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition ${
                tab === "password"
                  ? "bg-primary text-primary-foreground"
                  : "bg-white text-muted-foreground hover:bg-gray-50"
              }`}
            >
              <KeyRound className="w-4 h-4" />
              Password
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
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="10-digit mobile number"
                        autoComplete="tel"
                        maxLength={10}
                        className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={otpBusy || phone.length < 10}
                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {otpBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                    {otpBusy ? "Sending OTP…" : "Send OTP"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Enter OTP</label>
                    <p className="text-xs text-muted-foreground mb-3">Code sent to +91 {phone}</p>
                    <input
                      required
                      type="text"
                      inputMode="numeric"
                      pattern="\d{6}"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="6-digit OTP"
                      autoComplete="one-time-code"
                      maxLength={6}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-center tracking-[0.4em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={otpBusy || code.length < 6}
                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {otpBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                    {otpBusy ? "Verifying…" : "Verify & Sign In"}
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    className="w-full text-sm text-muted-foreground hover:text-primary transition"
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
                <label htmlFor="username" className="block text-sm font-medium mb-1.5">
                  Username or Email
                </label>
                <input
                  id="username"
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
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
