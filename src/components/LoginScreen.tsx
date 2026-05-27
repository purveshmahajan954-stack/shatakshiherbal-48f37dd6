import { useState } from "react";
import { toast } from "sonner";
import { Leaf, Loader2, AlertTriangle, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

type Method = "email" | "phone";

// Detect Supabase errors that indicate the phone/SMS provider isn't configured.
function isPhoneProviderDisabledError(err: any): boolean {
  const msg = (err?.message || "").toLowerCase();
  const code = (err?.code || err?.error_code || "").toLowerCase();
  return (
    code === "sms_provider_not_configured" ||
    code === "validation_failed" && msg.includes("phone") ||
    msg.includes("phone provider") ||
    msg.includes("sms provider") ||
    msg.includes("phone logins are disabled") ||
    msg.includes("phone signups are disabled") ||
    msg.includes("unsupported phone provider") ||
    (msg.includes("phone") && msg.includes("not enabled")) ||
    (msg.includes("provider") && msg.includes("not enabled"))
  );
}

export function LoginScreen({ title, subtitle }: { title?: string; subtitle?: string } = {}) {
  const [method, setMethod] = useState<Method>("email");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [phoneDisabled, setPhoneDisabled] = useState(false);

  // Phone OTP state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const normalizePhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (raw.trim().startsWith("+")) return "+" + digits;
    if (digits.length === 10) return "+91" + digits; // default to India
    return "+" + digits;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created! You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = normalizePhone(phone);
    if (formatted.replace(/\D/g, "").length < 10) {
      return toast.error("Please enter a valid phone number");
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
      if (error) throw error;
      setOtpSent(true);
      toast.success(`OTP sent to ${formatted}`);
    } catch (err: any) {
      if (isPhoneProviderDisabledError(err)) {
        setPhoneDisabled(true);
      } else {
        toast.error(err.message || "Could not send OTP");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return toast.error("Enter the OTP from your SMS");
    setBusy(true);
    try {
      const formatted = normalizePhone(phone);
      const { error } = await supabase.auth.verifyOtp({
        phone: formatted,
        token: otp,
        type: "sms",
      });
      if (error) throw error;
      toast.success("Signed in successfully!");
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed");
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
          <button
            type="button"
            disabled={busy}
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2 border border-border rounded-md px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.61z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />OR<div className="h-px flex-1 bg-border" />
          </div>

          {/* Method tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-muted/50 rounded-md mb-4">
            <button
              type="button"
              onClick={() => { setMethod("email"); setOtpSent(false); }}
              className={`text-sm py-2 rounded-md font-medium transition ${
                method === "email" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"
              }`}
            >
              Email + Password
            </button>
            <button
              type="button"
              onClick={() => { setMethod("phone"); setOtpSent(false); }}
              className={`text-sm py-2 rounded-md font-medium transition ${
                method === "phone" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"
              }`}
            >
              Mobile OTP
            </button>
          </div>

          {method === "email" ? (
            <>
              <form onSubmit={handleEmailSubmit} className="space-y-3">
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
            </>
          ) : phoneDisabled ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-3">
              <div className="flex gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold mb-1">Mobile OTP isn't set up yet</p>
                  <p className="text-amber-800 leading-relaxed">
                    SMS login needs an SMS provider (e.g. Twilio, MSG91) to be
                    configured in the backend auth settings before it can send codes.
                    Until then, please sign in with email or Google.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setMethod("email"); setPhoneDisabled(false); }}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-md font-medium hover:opacity-90 transition"
              >
                <Mail className="w-4 h-4" />
                Use Email + Password instead
              </button>
              <button
                type="button"
                onClick={() => setPhoneDisabled(false)}
                className="w-full text-xs text-amber-900/70 hover:text-amber-900"
              >
                ← Try a different number
              </button>
            </div>
          ) : (
            <>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <label className="block text-xs text-muted-foreground">
                    Indian numbers default to +91. Include country code for others.
                  </label>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                    Send OTP
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit code sent to <span className="font-medium text-foreground">{normalizePhone(phone)}</span>
                  </p>
                  <input
                    required
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full border border-border rounded-md px-4 py-2.5 text-center tracking-[0.5em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                    Verify & Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(""); }}
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                  >
                    ← Use a different number
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
