import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, Loader2, Phone, KeyRound, Eye, EyeOff, ArrowLeft } from "lucide-react";
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
type ForgotStep = "phone" | "reset" | "done";

function PasswordInput({
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete = "new-password",
  placeholder = "Enter password",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <div className="relative">
        <input
          required
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full border border-border rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function AdminLoginPage() {
  const navigate = useNavigate();
  const { admin, loading } = useAdminAuth();

  const [tab, setTab] = useState<Tab>("otp");
  const [error, setError] = useState<string | null>(null);

  // Password login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  // Phone OTP login
  const [otpStep, setOtpStep] = useState<OtpStep>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);

  // Forgot password
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>("phone");
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && admin) navigate({ to: "/admin", replace: true });
  }, [loading, admin, navigate]);

  // ── Password login ──────────────────────────────────────────
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

  // ── Phone OTP login ─────────────────────────────────────────
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

  // ── Forgot Password ─────────────────────────────────────────
  const openForgot = () => {
    setForgotMode(true);
    setForgotStep("phone");
    setForgotPhone("");
    setForgotCode("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotError(null);
  };

  const closeForgot = () => {
    setForgotMode(false);
    setForgotError(null);
  };

  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (forgotPhone.length < 10) return;
    setForgotBusy(true);
    try {
      const res = await fetch("/api/admin/password-reset-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: forgotPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setForgotStep("reset");
    } catch (err: any) {
      setForgotError(err?.message || "Failed to send OTP. Please try again.");
    } finally {
      setForgotBusy(false);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (newPassword.length < 6) { setForgotError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setForgotError("Passwords do not match."); return; }
    setForgotBusy(true);
    try {
      const res = await fetch("/api/admin/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: forgotPhone, code: forgotCode, password: newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password reset failed");
      localStorage.setItem("admin_token", data.token);
      if (data.admin) localStorage.setItem("admin_data", JSON.stringify(data.admin));
      setForgotStep("done");
      setTimeout(() => navigate({ to: "/admin", replace: true }), 1500);
    } catch (err: any) {
      setForgotError(err?.message || "Password reset failed. Please try again.");
    } finally {
      setForgotBusy(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream via-cream to-primary/5 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl text-foreground">
            {forgotMode ? "Reset Password" : "Admin Sign In"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {forgotMode
              ? forgotStep === "phone" ? "Verify your admin mobile number"
                : forgotStep === "reset" ? "Enter OTP and set a new password"
                : "Password updated successfully!"
              : "Restricted Area — Authorized Personnel Only"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-7 border border-border/50 space-y-5">

          {/* ── FORGOT PASSWORD FLOW ── */}
          {forgotMode ? (
            <>
              {forgotStep === "phone" && (
                <form onSubmit={handleForgotSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Admin Mobile Number</label>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-3 py-2.5 border border-border rounded-xl text-sm text-muted-foreground bg-gray-50">
                        +91
                      </span>
                      <input
                        required
                        type="tel"
                        value={forgotPhone}
                        onChange={(e) => { setForgotPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setForgotError(null); }}
                        placeholder="10-digit mobile number"
                        autoComplete="tel"
                        maxLength={10}
                        inputMode="numeric"
                        className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  {forgotError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{forgotError}</div>
                  )}
                  <button
                    type="submit"
                    disabled={forgotBusy || forgotPhone.length < 10}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {forgotBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                    {forgotBusy ? "Sending OTP…" : "Send OTP"}
                  </button>
                </form>
              )}

              {forgotStep === "reset" && (
                <form onSubmit={handleForgotReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">OTP</label>
                    <p className="text-xs text-muted-foreground mb-2">6-digit code sent to +91 {forgotPhone}</p>
                    <input
                      required
                      type="text"
                      inputMode="numeric"
                      pattern="\d{6}"
                      value={forgotCode}
                      onChange={(e) => { setForgotCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setForgotError(null); }}
                      placeholder="6-digit OTP"
                      autoComplete="one-time-code"
                      maxLength={6}
                      autoFocus
                      className="w-full border border-border rounded-xl px-4 py-3 text-center tracking-[0.5em] font-mono text-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <PasswordInput
                    label="New Password"
                    value={newPassword}
                    onChange={setNewPassword}
                    show={showNew}
                    onToggle={() => setShowNew(p => !p)}
                    placeholder="Min. 6 characters"
                  />
                  <PasswordInput
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    show={showConfirm}
                    onToggle={() => setShowConfirm(p => !p)}
                    placeholder="Re-enter new password"
                  />
                  {forgotError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{forgotError}</div>
                  )}
                  <button
                    type="submit"
                    disabled={forgotBusy || forgotCode.length < 6}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {forgotBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                    {forgotBusy ? "Updating password…" : "Update Password & Login"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setForgotStep("phone"); setForgotCode(""); setForgotError(null); }}
                    className="w-full text-sm text-muted-foreground hover:text-primary transition py-1"
                  >
                    Change number / Resend OTP
                  </button>
                </form>
              )}

              {forgotStep === "done" && (
                <div className="text-center py-4 space-y-2">
                  <div className="text-4xl">✅</div>
                  <p className="font-medium text-foreground">Password updated!</p>
                  <p className="text-sm text-muted-foreground">Redirecting to admin panel…</p>
                </div>
              )}

              {forgotStep !== "done" && (
                <button
                  type="button"
                  onClick={closeForgot}
                  className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:underline pt-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </button>
              )}
            </>
          ) : (
            <>
              {/* ── TAB SWITCHER ── */}
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

              {/* ── PHONE OTP TAB ── */}
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
                        <p className="text-xs text-muted-foreground mb-3">A 6-digit code was sent to +91 {phone}</p>
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
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
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

              {/* ── PASSWORD TAB ── */}
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
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium">Password</label>
                      <button
                        type="button"
                        onClick={openForgot}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
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
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
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
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Only authorized admin numbers can access this panel.
        </p>
      </div>
    </div>
  );
}
