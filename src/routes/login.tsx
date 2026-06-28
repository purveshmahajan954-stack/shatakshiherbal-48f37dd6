import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Leaf, Loader2, Eye, EyeOff, Phone, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

type LoginSearch = { redirect?: string; error?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): LoginSearch => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    error: typeof s.error === "string" ? s.error : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign In — Shatakshi Herbal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_cancelled: "Google sign-in was cancelled.",
  google_state_mismatch: "Security check failed. Please try again.",
  google_token_failed: "Could not complete Google sign-in. Please try again.",
  google_userinfo_failed: "Could not retrieve Google account info.",
  google_no_email: "Your Google account has no email address.",
  google_not_configured: "Google sign-in is not available right now.",
  google_server_error: "An error occurred. Please try again.",
};

type Tab = "email" | "phone";
type OtpStep = "phone" | "code";

function LoginPage() {
  const { refreshUser, user } = useAuth();
  const navigate = useNavigate();
  const { redirect, error: urlError } = Route.useSearch();

  const [tab, setTab] = useState<Tab>("phone");

  // Email/password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  // Phone OTP
  const [otpStep, setOtpStep] = useState<OtpStep>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const confirmationRef = useRef<any>(null); // kept for type compat, unused

  useEffect(() => {
    if (urlError) toast.error(GOOGLE_ERROR_MESSAGES[urlError] ?? "Sign-in failed. Please try again.");
  }, [urlError]);

  useEffect(() => {
    if (user) navigate({ to: (redirect as any) || "/" });
  }, [user, redirect]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign-in failed");
      localStorage.setItem("auth_token", data.token);
      document.cookie = `auth_token=${data.token}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
      await refreshUser();
      toast.success("Welcome back!");
      navigate({ to: (redirect as any) || "/" });
    } catch (err: any) {
      toast.error(err.message || "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = () => {
    setGoogleBusy(true);
    window.location.href = "/api/auth/google";
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setOtpBusy(true);
    try {
      const res = await fetch("/api/auth/otp-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setOtpStep("code");
      toast.success("OTP sent to your phone!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send OTP. Please try again.");
    } finally {
      setOtpBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setOtpBusy(true);
    try {
      const res = await fetch("/api/auth/otp-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      localStorage.setItem("auth_token", data.token);
      document.cookie = `auth_token=${data.token}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
      await refreshUser();
      toast.success("Welcome!");
      navigate({ to: (redirect as any) || "/" });
    } catch (err: any) {
      const msg = err?.message || "Invalid OTP. Please try again.";
      toast.error(msg);
      if (msg.toLowerCase().includes("incorrect") || msg.toLowerCase().includes("expired")) {
        setCode("");
      }
    } finally {
      setOtpBusy(false);
    }
  };

  const handleResend = () => {
    setOtpStep("phone");
    setCode("");
    confirmationRef.current = null;
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

          <div className="bg-white rounded-2xl shadow-card border border-border/50 p-7 space-y-5">
            {/* Tab switcher */}
            <div className="flex rounded-xl border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setTab("phone")}
                className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition ${
                  tab === "phone"
                    ? "bg-primary text-primary-foreground"
                    : "bg-white text-muted-foreground hover:bg-gray-50"
                }`}
              >
                <Phone className="w-4 h-4" />
                Phone OTP
              </button>
              <button
                type="button"
                onClick={() => setTab("email")}
                className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition ${
                  tab === "email"
                    ? "bg-primary text-primary-foreground"
                    : "bg-white text-muted-foreground hover:bg-gray-50"
                }`}
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
            </div>

            {/* Phone OTP tab */}
            {tab === "phone" && (
              <>
                {otpStep === "phone" ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Mobile Number
                      </label>
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
                          className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                    </div>
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
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Enter OTP
                      </label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Code sent to +91 {phone}
                      </p>
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
                        className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-center tracking-[0.4em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
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
                      className="w-full text-sm text-muted-foreground hover:text-primary transition"
                    >
                      Change number / Resend OTP
                    </button>
                  </form>
                )}
              </>
            )}

            {/* Email/password tab */}
            {tab === "email" && (
              <>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        required
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className="w-full border border-border rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                    Sign In
                  </button>
                </form>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <button
                  type="button"
                  disabled={googleBusy}
                  onClick={handleGoogle}
                  className="w-full flex items-center justify-center gap-3 border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground bg-white hover:bg-gray-50 transition disabled:opacity-50"
                >
                  {googleBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                      <path d="M43.6 20.5H42V20H24v8h11.3C33.7 32.8 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" fill="#FFC107"/>
                      <path d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" fill="#FF3D00"/>
                      <path d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.5 26.8 36.5 24 36.5c-5.3 0-9.7-3.2-11.3-7.8l-6.6 5.1C9.5 39.6 16.2 44 24 44z" fill="#4CAF50"/>
                      <path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l6.2 5.2C37 38.8 44 33 44 24c0-1.2-.1-2.3-.4-3.5z" fill="#1976D2"/>
                    </svg>
                  )}
                  Continue with Google
                </button>
              </>
            )}

            <p className="text-center text-sm text-muted-foreground">
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
