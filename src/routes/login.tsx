import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Leaf, Loader2, Eye, EyeOff, Phone, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { OtpInput } from "@/components/OtpInput";
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

type AuthMethod = "otp" | "password";
type OtpStep = "phone" | "verify" | "success";

const RESEND_SECONDS = 30;

function GoogleButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground bg-white hover:bg-gray-50 transition disabled:opacity-50"
    >
      {loading ? (
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
  );
}

function LoginPage() {
  const { refreshUser, user } = useAuth();
  const navigate = useNavigate();
  const { redirect, error: urlError } = Route.useSearch();

  const [method, setMethod] = useState<AuthMethod>("otp");
  const [otpStep, setOtpStep] = useState<OtpStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (urlError) {
      toast.error(GOOGLE_ERROR_MESSAGES[urlError] ?? "Sign-in failed. Please try again.");
    }
  }, [urlError]);

  useEffect(() => {
    if (user) navigate({ to: (redirect as any) || "/" });
  }, [user, redirect]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCountdown = () => {
    setCountdown(RESEND_SECONDS);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/otp-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setOtpStep("verify");
      setOtp("");
      startCountdown();
      toast.success("OTP sent to your mobile!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { toast.error("Enter the 6-digit OTP"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/otp-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp, context: "login" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      localStorage.setItem("auth_token", data.token);
      await refreshUser();
      setOtpStep("success");
      setTimeout(() => navigate({ to: (redirect as any) || "/" }), 1200);
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordSignin = async (e: React.FormEvent) => {
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

          <div className="bg-white rounded-2xl shadow-card border border-border/50 overflow-hidden">
            {otpStep === "success" ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-1">You're signed in!</h2>
                <p className="text-sm text-muted-foreground">Redirecting you now…</p>
              </div>
            ) : otpStep === "verify" ? (
              <div className="p-7">
                <button
                  onClick={() => { setOtpStep("phone"); setOtp(""); }}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Change number
                </button>
                <h2 className="text-lg font-semibold text-foreground mb-1">Enter OTP</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Sent to <span className="font-medium text-foreground">+91 {phone.replace(/\D/g,"")}</span>
                </p>
                <OtpInput value={otp} onChange={setOtp} disabled={busy} />
                <button
                  onClick={handleVerifyOtp}
                  disabled={busy || otp.length !== 6}
                  className="w-full mt-6 bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  Verify & Sign In
                </button>
                <div className="text-center mt-4">
                  {countdown > 0 ? (
                    <span className="text-sm text-muted-foreground">
                      Resend OTP in <span className="font-medium text-foreground tabular-nums">{countdown}s</span>
                    </span>
                  ) : (
                    <button
                      onClick={handleSendOtp}
                      disabled={busy}
                      className="text-sm text-primary font-medium hover:underline disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex border-b border-border">
                  <button
                    onClick={() => setMethod("otp")}
                    className={`flex-1 py-3.5 text-sm font-medium flex items-center justify-center gap-2 transition ${
                      method === "otp"
                        ? "text-primary border-b-2 border-primary bg-primary/5"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Phone className="w-4 h-4" /> Mobile OTP
                  </button>
                  <button
                    onClick={() => setMethod("password")}
                    className={`flex-1 py-3.5 text-sm font-medium flex items-center justify-center gap-2 transition ${
                      method === "password"
                        ? "text-primary border-b-2 border-primary bg-primary/5"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Mail className="w-4 h-4" /> Email & Password
                  </button>
                </div>

                <div className="p-7 space-y-4">
                  {method === "otp" ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Mobile Number
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3.5 border border-r-0 border-border rounded-l-xl bg-gray-50 text-sm text-muted-foreground font-medium">
                            +91
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            value={phone.replace(/\D/g, "")}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                            placeholder="9876543210"
                            className="flex-1 border border-border rounded-r-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleSendOtp}
                        disabled={busy || phone.replace(/\D/g, "").length !== 10}
                        className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                      >
                        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                        Send OTP
                      </button>
                    </>
                  ) : (
                    <form onSubmit={handlePasswordSignin} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                        <input
                          required
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
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
                  )}

                  <div className="relative flex items-center gap-3 my-1">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <GoogleButton loading={googleBusy} onClick={handleGoogle} />

                  <p className="text-center text-sm text-muted-foreground pt-1">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-primary font-medium hover:underline">
                      Create account
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
