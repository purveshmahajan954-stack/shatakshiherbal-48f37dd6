import { useState } from "react";
import { X, AlertTriangle, Send } from "lucide-react";

const REASONS = [
  "Found a better deal elsewhere",
  "Technical issues with the website",
  "I changed my mind",
  "Have issues with coupons",
  "Payment issues / not working",
  "Others",
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AbandonmentPopup({ open, onClose }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [other, setOther] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const toggle = (reason: string) => {
    setSelected((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const reasons = other.trim()
        ? [...selected.filter((r) => r !== "Others"), `Others: ${other.trim()}`]
        : selected;

      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Cart Abandonment Feedback",
          email: "noreply@feedback.internal",
          message: reasons.length > 0
            ? `Abandonment reasons: ${reasons.join(", ")}`
            : "User skipped the feedback form.",
        }),
      });
    } catch {}
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-[#1a1a2e] text-white px-5 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-base">Sorry To See You Go..</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stock warning banner */}
        <div className="bg-red-50 border-b border-red-100 px-5 py-2.5 flex items-center gap-2 text-red-700 text-sm font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Products in huge demand might run Out of Stock
        </div>

        {submitted ? (
          <div className="px-5 py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Send className="w-6 h-6 text-primary" />
            </div>
            <p className="font-semibold text-lg mb-1">Thank you for your feedback!</p>
            <p className="text-sm text-muted-foreground">We'll work on improving your experience.</p>
          </div>
        ) : (
          <div className="px-5 py-5">
            <p className="text-sm font-medium text-foreground mb-4">
              What stopped you from completing your purchase?
            </p>

            <div className="space-y-3 mb-4">
              {REASONS.map((reason) => (
                <label key={reason} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => toggle(reason)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selected.includes(reason)
                        ? "bg-primary border-primary"
                        : "border-border group-hover:border-primary/50"
                    }`}
                  >
                    {selected.includes(reason) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-foreground" onClick={() => toggle(reason)}>
                    {reason}
                  </span>
                </label>
              ))}
            </div>

            {selected.includes("Others") && (
              <textarea
                value={other}
                onChange={(e) => setOther(e.target.value)}
                placeholder="Others (please specify)"
                rows={3}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4 placeholder:text-muted-foreground"
              />
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={handleSubmit}
                disabled={submitting || (selected.length === 0)}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition disabled:opacity-40"
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
              <button
                onClick={onClose}
                className="w-full bg-muted text-muted-foreground py-3 rounded-xl font-semibold text-sm hover:bg-muted/80 transition"
              >
                Skip and exit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
