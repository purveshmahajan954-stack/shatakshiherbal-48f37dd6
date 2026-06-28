import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth.tsx";
import { LoginScreen } from "@/components/LoginScreen";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2, User, Phone, Mail, MapPin, Pencil, Check, X,
  ChevronRight, Package, LayoutDashboard,
} from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Shatakshi Herbal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function Field({
  label,
  icon,
  value,
  placeholder,
  type = "text",
  readOnly = false,
  onSave,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  placeholder: string;
  type?: string;
  readOnly?: boolean;
  onSave?: (v: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!editing) setVal(value); }, [value, editing]);

  const save = async () => {
    if (!val.trim() && !readOnly) return;
    setBusy(true);
    try {
      await onSave?.(val.trim());
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-accent/30 border border-border/40">
      <div className="mt-0.5 text-primary shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">{label}</div>
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type={type}
              value={val}
              onChange={e => setVal(e.target.value)}
              placeholder={placeholder}
              className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
            />
            <button onClick={save} disabled={busy} className="text-primary disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button onClick={() => setEditing(false)} className="text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">
              {value || <span className="text-muted-foreground italic">{placeholder}</span>}
            </span>
            {!readOnly && onSave && (
              <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-primary transition">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <LoginScreen title="Sign in to view your profile" subtitle="Manage your name, email and address" />;

  const patch = (field: string) => async (value: string) => {
    const token = localStorage.getItem("auth_token");
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ [field]: value }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to save");
    await refreshUser();
    toast.success("Profile updated!");
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream/40">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link to="/dashboard" className="hover:text-primary transition">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">My Profile</span>
        </div>

        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-card border border-border/50 p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold">
                {user.fullName || "My Profile"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {user.phone ? `+91 ${user.phone}` : "Member"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Field
              label="Full Name"
              icon={<User className="w-4 h-4" />}
              value={user.fullName ?? ""}
              placeholder="Enter your full name"
              onSave={patch("fullName")}
            />

            <Field
              label="Mobile Number"
              icon={<Phone className="w-4 h-4" />}
              value={user.phone ? `+91 ${user.phone}` : ""}
              placeholder="Phone not set"
              readOnly
            />

            <Field
              label="Email Address"
              icon={<Mail className="w-4 h-4" />}
              value={user.email ?? ""}
              placeholder="Add your email address"
              type="email"
              onSave={patch("email")}
            />

            <Field
              label="Address"
              icon={<MapPin className="w-4 h-4" />}
              value={user.address ?? ""}
              placeholder="Add your delivery address"
              onSave={patch("address")}
            />
          </div>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 bg-white rounded-xl p-4 border border-border/50 shadow-sm hover:border-primary/30 hover:shadow-md transition group"
          >
            <LayoutDashboard className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold">Dashboard</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-primary transition" />
          </Link>
          <Link
            to="/orders"
            className="flex items-center gap-3 bg-white rounded-xl p-4 border border-border/50 shadow-sm hover:border-primary/30 hover:shadow-md transition group"
          >
            <Package className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold">My Orders</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-primary transition" />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
