import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Shield, Loader2, Phone } from "lucide-react";
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

type OtpStep = "phone" | "code";

function AdminLoginPage() {
  const navigate = useNavigate();
  const { admin, loading } = useAdminAuth();

  const [otpStep, setOtpStep] = useState<OtpStep>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmationRef = useRef<any>(null);

  useEffect(() => {
    if (!loading && admin) navigate({ to: "/admin", replace: true });
  }, [loading, admin, navigate]);

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
      setError(err?.message || "OTP bhejne mein problem aayi. Dobara try karein.");
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
      setError(err?.message || "Galat OTP. Dobara try karein.");
      if (err?.message?.toLowerCase().includes("invalid") || err?.message?.toLowerCase().includes("expired")) {
        setCode("");
      }
    } finally {
      setOtpBusy(false);
    }
  };

  const handleResend = async () => {
    setOtpStep("phone");
    setCode("");
    setError(null);
    confirmationRef.current = null;
    const { clearRecaptcha } = await import("@/lib/firebase");
    clearRecaptcha();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream via-cream to-primary/5 px-4 py-10">
      <div id="admin-recaptcha-container" />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl text-foreground">Admin Sign In</h1>
          <p className="text-sm text-muted-foreground mt-1">Restricted Area</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-7 border border-border/50 space-y-5">
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
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={otpBusy || phone.length < 10}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {otpBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                {otpBusy ? "OTP bhej rahe hain…" : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">OTP Enter Karein</label>
                <p className="text-xs text-muted-foreground mb-3">
                  +91 {phone} par code bheja gaya hai
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
                {otpBusy ? "Verify ho raha hai…" : "Verify & Sign In"}
              </button>
              <button
                type="button"
                onClick={handleResend}
                className="w-full text-sm text-muted-foreground hover:text-primary transition py-1"
              >
                Number change karein / OTP dobara bhejein
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
