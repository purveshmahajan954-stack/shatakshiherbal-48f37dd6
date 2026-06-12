import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { LoginScreen } from "@/components/LoginScreen";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2, User, Phone, Mail, Package, ShoppingBag,
  LogOut, Pencil, Check, X, Truck, FileDown, Copy,
  ChevronRight, Lock, MapPin, Eye, EyeOff, Trash2, Plus, Minus, Search, Star,
} from "lucide-react";
import type { SavedAddress } from "@/lib/auth";

const INDIAN_STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"];
import { downloadInvoice } from "@/lib/invoice";

const STATUS_STYLES: Record<string, string> = {
  paid:             "bg-primary/10 text-primary",
  confirmed:        "bg-primary/10 text-primary",
  pending:          "bg-yellow-50 text-yellow-700",
  created:          "bg-muted text-muted-foreground",
  failed:           "bg-destructive/10 text-destructive",
  signature_failed: "bg-destructive/10 text-destructive",
};
const STATUS_LABEL: Record<string, string> = {
  paid: "Paid", confirmed: "Confirmed", pending: "Pending",
  created: "Processing", failed: "Failed", signature_failed: "Failed",
};

function copyText(text: string, label: string) {
  navigator.clipboard?.writeText(text).then(() => toast.success(`${label} copied`));
}

async function patchProfile(data: Record<string, string>) {
  const token = localStorage.getItem("auth_token");
  const res = await fetch("/api/user/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to save");
  return json;
}

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — Shatakshi Herbal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

/* ── small inline editable row ─────────────────────────────────────────── */
function EditRow({
  label, icon, value, placeholder, onSave, type = "text", hint,
}: {
  label: string; icon: React.ReactNode; value: string; placeholder: string;
  onSave: (v: string) => Promise<void>; type?: string; hint?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => { if (!editing) setVal(value); }, [value, editing]);

  const save = async () => {
    setBusy(true);
    try { await onSave(val); setEditing(false); } finally { setBusy(false); }
  };

  return (
    <div className="flex items-start gap-3 bg-accent/30 rounded-lg px-4 py-3">
      <div className="mt-0.5 text-primary shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</div>
        {editing ? (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-0">
              <input
                autoFocus
                type={type === "password" && !show ? "password" : "text"}
                value={val}
                onChange={e => setVal(e.target.value)}
                placeholder={placeholder}
                className="w-full border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-8"
              />
              {type === "password" && (
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
            <button onClick={save} disabled={busy} className="text-primary disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button onClick={() => setEditing(false)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium truncate">
              {value
                ? (type === "password" ? "••••••••" : value)
                : <span className="text-muted-foreground italic">{placeholder}</span>}
            </span>
            <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-primary shrink-0">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {hint && !editing && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
      </div>
    </div>
  );
}

/* ── address form (shared for add / edit) ───────────────────────────────── */
const BLANK_ADDR = { label: "Home", flatHouse: "", areaStreet: "", landmark: "", district: "", pincode: "", city: "", state: "", isDefault: false };

function AddressForm({
  initial,
  onSave,
  onCancel,
  isFirst,
}: {
  initial?: Partial<SavedAddress>;
  onSave: (a: Omit<SavedAddress, "id">) => Promise<void>;
  onCancel: () => void;
  isFirst?: boolean;
}) {
  const [label, setLabel] = useState(initial?.label ?? "Home");
  const [flatHouse, setFlatHouse] = useState(initial?.flatHouse ?? "");
  const [areaStreet, setAreaStreet] = useState(initial?.areaStreet ?? "");
  const [landmark, setLandmark] = useState(initial?.landmark ?? "");
  const [district, setDistrict] = useState(initial?.district ?? "");
  const [pincode, setPincode] = useState(initial?.pincode ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [addrState, setAddrState] = useState(initial?.state ?? "");
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? isFirst ?? false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchPincode = async (pin: string) => {
    if (pin.length !== 6) return;
    setPincodeLoading(true); setPincodeError(null);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data[0]?.Status === "Success") {
        const po = data[0].PostOffice?.[0];
        if (po) {
          setCity(po.Division || po.Name || "");
          setAddrState(po.State || "");
          setDistrict(po.District || "");
        }
      } else { setPincodeError("Invalid pincode"); }
    } catch { setPincodeError("Could not fetch pincode"); }
    finally { setPincodeLoading(false); }
  };

  const handlePincodeChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 6);
    setPincode(digits); setPincodeError(null);
    if (digits.length === 6) fetchPincode(digits);
    else { setCity(""); setAddrState(""); setDistrict(""); }
  };

  const save = async () => {
    if (!flatHouse.trim()) return toast.error("Enter flat/house address");
    if (pincode.length !== 6) return toast.error("Enter valid 6-digit pincode");
    if (!city.trim()) return toast.error("Enter city");
    if (!addrState.trim()) return toast.error("Select state");
    setBusy(true);
    try {
      await onSave({ label, flatHouse, areaStreet, landmark, district, pincode, city, state: addrState, isDefault });
    } finally { setBusy(false); }
  };

  return (
    <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-3">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground font-medium">Address Label</label>
        <div className="flex gap-2">
          {["Home", "Office", "Other"].map(l => (
            <button key={l} onClick={() => setLabel(l)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${label === l ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
              {l}
            </button>
          ))}
          {!["Home", "Office", "Other"].includes(label) && (
            <input value={label} onChange={e => setLabel(e.target.value)} className="border border-border rounded-full px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Flat, House no., Building, Apartment</label>
        <input autoFocus value={flatHouse} onChange={e => setFlatHouse(e.target.value)} placeholder="e.g. 12B, Shanti Niwas" className="w-full border border-border bg-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Area, Street, Sector, Village</label>
        <input value={areaStreet} onChange={e => setAreaStreet(e.target.value)} placeholder="e.g. Shivaji Ward, MG Road" className="w-full border border-border bg-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Landmark <span className="text-muted-foreground/60">(optional)</span></label>
        <input value={landmark} onChange={e => setLandmark(e.target.value)} placeholder="e.g. Near Apollo Hospital" className="w-full border border-border bg-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Pincode</label>
          <div className="relative">
            <input value={pincode} onChange={e => handlePincodeChange(e.target.value)} placeholder="6 digit PIN" inputMode="numeric" maxLength={6}
              className={`w-full border bg-white rounded-md px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-primary ${pincodeError ? "border-red-400" : "border-border"}`} />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              {pincodeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <Search className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
          </div>
          {pincodeError && <p className="text-[11px] text-red-500">{pincodeError}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">District</label>
          <input value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. Narsinghpur" className="w-full border border-border bg-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Town / City</label>
          <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Gadarwara" className="w-full border border-border bg-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">State</label>
          <select value={addrState} onChange={e => setAddrState(e.target.value)} className="w-full border border-border bg-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Choose state</option>
            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-sm">
        <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="accent-primary" />
        Set as default address
      </label>

      <div className="flex gap-2 pt-1">
        <button onClick={save} disabled={busy} className="flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save Address
        </button>
        <button onClick={onCancel} className="flex items-center gap-1.5 border border-border text-sm text-muted-foreground px-4 py-2 rounded-lg hover:bg-accent/50">
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </div>
  );
}

/* ── saved addresses section ────────────────────────────────────────────── */
function SavedAddressesSection({ userId }: { userId: string }) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const token = () => localStorage.getItem("auth_token") ?? "";

  const load = async () => {
    try {
      const res = await fetch("/api/user/addresses", { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setAddresses(data.addresses ?? []);
    } catch { toast.error("Could not load addresses"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [userId]);

  const handleAdd = async (a: Omit<SavedAddress, "id">) => {
    const res = await fetch("/api/user/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify(a),
    });
    if (!res.ok) { toast.error("Failed to save address"); return; }
    toast.success("Address saved!");
    setAdding(false);
    load();
  };

  const handleEdit = (id: string) => async (a: Omit<SavedAddress, "id">) => {
    const res = await fetch(`/api/user/addresses?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify(a),
    });
    if (!res.ok) { toast.error("Failed to update address"); return; }
    toast.success("Address updated!");
    setEditingId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/user/addresses?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (!res.ok) { toast.error("Failed to delete address"); return; }
    toast.success("Address deleted");
    load();
  };

  const handleSetDefault = async (id: string) => {
    const addr = addresses.find(a => a.id === id);
    if (!addr) return;
    await fetch(`/api/user/addresses?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ ...addr, isDefault: true }),
    });
    load();
  };

  return (
    <div className="flex items-start gap-3 bg-accent/30 rounded-lg px-4 py-3">
      <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Saved Addresses</div>
          {!adding && (
            <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
              <Plus className="w-3.5 h-3.5" /> Add New
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-4 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-3">
            {addresses.map(addr => (
              <div key={addr.id}>
                {editingId === addr.id ? (
                  <AddressForm
                    initial={addr}
                    onSave={handleEdit(addr.id)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className={`relative border rounded-xl p-3 bg-white transition ${addr.isDefault ? "border-primary/40 ring-1 ring-primary/20" : "border-border"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{addr.label}</span>
                          {addr.isDefault && (
                            <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-semibold">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground leading-snug">
                          {[addr.flatHouse, addr.areaStreet, addr.landmark, addr.district, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!addr.isDefault && (
                          <button onClick={() => handleSetDefault(addr.id)} title="Set as default" className="p-1.5 text-muted-foreground hover:text-amber-500 rounded-md hover:bg-accent/50">
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => setEditingId(addr.id)} className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-accent/50">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(addr.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-accent/50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {adding && (
              <AddressForm
                isFirst={addresses.length === 0}
                onSave={handleAdd}
                onCancel={() => setAdding(false)}
              />
            )}

            {addresses.length === 0 && !adding && (
              <p className="text-sm text-muted-foreground italic">No saved addresses yet. Add one to speed up checkout!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── main page ──────────────────────────────────────────────────────────── */
function AccountPage() {
  const { user, loading, signOut, refreshUser } = useAuth();
  const { items: cartItems, total: cartTotal, setQty, remove: removeFromCart } = useCart();
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  async function fetchOrders() {
    setOrdersLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/user/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch {
      toast.error("Could not load orders");
    } finally {
      setOrdersLoading(false);
    }
  }

  const save = (field: string) => async (value: string) => {
    await patchProfile({ [field]: value });
    await refreshUser();
    toast.success("Saved!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <LoginScreen title="Sign in to view your account" subtitle="See your profile and order history" />;

  return (
    <div className="min-h-screen flex flex-col bg-cream/40">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 space-y-8">

        {/* ── Profile card ─────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-card border border-border/50 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : <User className="w-7 h-7 text-primary" />}
            </div>
            <div>
              <div className="font-semibold text-lg">{user.fullName || "My Account"}</div>
              <div className="text-xs text-muted-foreground">Member</div>
            </div>
          </div>

          <div className="space-y-3">
            {/* Name */}
            <EditRow
              label="Full Name" icon={<User className="w-4 h-4" />}
              value={user.fullName ?? ""} placeholder="Enter your name"
              onSave={save("fullName")}
            />

            {/* Phone (read-only) */}
            {user.phone && (
              <div className="flex items-center gap-3 bg-accent/30 rounded-lg px-4 py-3">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Mobile</div>
                  <div className="text-sm font-medium">{user.phone}</div>
                </div>
              </div>
            )}

            {/* Email */}
            <EditRow
              label="Email Address" icon={<Mail className="w-4 h-4" />}
              value={user.email ?? ""} placeholder="Add your email address"
              onSave={save("email")} type="email"
              hint={!user.email ? "Add email so you can sign in with password too" : undefined}
            />

            {/* Password */}
            <EditRow
              label="Password" icon={<Lock className="w-4 h-4" />}
              value={user.hasPassword ? "set" : ""}
              placeholder={user.hasPassword ? "Change password" : "Set a password (min 6 chars)"}
              onSave={save("password")} type="password"
              hint={!user.hasPassword ? "Set a password to enable email + password login" : undefined}
            />

            {/* Saved Addresses */}
            <SavedAddressesSection userId={user.id} />
          </div>

          <div className="mt-5 pt-5 border-t border-border/50">
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 text-sm text-destructive font-medium hover:underline"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </section>

        {/* ── Orders ───────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl">My Orders</h2>
            <span className="text-sm text-muted-foreground">{orders.length} order{orders.length !== 1 ? "s" : ""}</span>
          </div>

          {ordersLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-card border border-border/50 p-12 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground mb-6">You haven't placed any orders yet.</p>
              <Link to="/shop" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:opacity-90 transition">
                <ShoppingBag className="w-4 h-4" /> Start Shopping
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {orders.map((o: any) => {
                const items: any[] = Array.isArray(o.items) ? o.items : [];
                const statusStyle = STATUS_STYLES[o.payment_status] ?? "bg-muted text-muted-foreground";
                const statusLabel = STATUS_LABEL[o.payment_status] ?? o.payment_status;
                return (
                  <li key={o.id} className="bg-white rounded-2xl shadow-card border border-border/50 p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-border/50">
                      <div>
                        <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Order ID</div>
                        <div className="font-mono font-semibold text-sm">#{o.id.slice(0, 8).toUpperCase()}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Date</div>
                        <div className="text-sm">{new Date(o.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Total</div>
                        <div className="text-sm font-semibold">₹{o.total}</div>
                      </div>
                      <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${statusStyle}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <ul className="mt-4 space-y-2">
                      {items.map((item: any, idx: number) => (
                        <li key={idx} className="flex items-center gap-3 text-sm">
                          {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-accent/30 shrink-0" />}
                          <span className="flex-1 truncate">{item.name}</span>
                          <span className="text-muted-foreground shrink-0">× {item.qty}</span>
                          <span className="w-20 text-right font-medium shrink-0">₹{(item.price * item.qty).toLocaleString("en-IN")}</span>
                        </li>
                      ))}
                    </ul>

                    {o.shipping_address && (
                      <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Deliver to: </span>
                        {o.shipping_name && <span>{o.shipping_name}, </span>}
                        {o.shipping_address}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {(o.payment_status === "paid" || o.payment_status === "confirmed") && (
                        <button
                          onClick={() => downloadInvoice(o)}
                          className="inline-flex items-center gap-1.5 border border-primary/40 text-primary bg-primary/5 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-primary/10 transition"
                        >
                          <FileDown className="w-3.5 h-3.5" /> Invoice
                        </button>
                      )}
                      {o.tracking_id && (
                        <Link
                          to="/track/$trackingId"
                          params={{ trackingId: o.tracking_id }}
                          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-semibold hover:opacity-90 transition"
                        >
                          <Truck className="w-3.5 h-3.5" /> Track Order
                        </Link>
                      )}
                      {o.razorpay_order_id && (
                        <button
                          onClick={() => copyText(o.razorpay_order_id, "Order ID")}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
                        >
                          <Copy className="w-3 h-3" /> Copy ID
                        </button>
                      )}
                      {o.payment_status !== "paid" && o.payment_status !== "confirmed" && (
                        <Link to="/checkout" className="text-xs text-primary font-semibold hover:underline ml-auto">
                          Retry payment <ChevronRight className="w-3 h-3 inline" />
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── My Cart ──────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl">My Cart</h2>
            <span className="text-sm text-muted-foreground">{cartItems.length} item{cartItems.length !== 1 ? "s" : ""}</span>
          </div>

          {cartItems.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-card border border-border/50 p-12 text-center">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground mb-6">Your cart is empty.</p>
              <Link to="/shop" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:opacity-90 transition">
                <ShoppingBag className="w-4 h-4" /> Browse Products
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-card border border-border/50 p-5 sm:p-6">
              <ul className="divide-y divide-border/50">
                {cartItems.map((item) => (
                  <li key={item.name} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover bg-accent/30 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">₹{item.price.toLocaleString("en-IN")} each</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setQty(item.name, item.qty - 1)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                      <button
                        onClick={() => setQty(item.name, item.qty + 1)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="w-20 text-right font-semibold text-sm shrink-0">
                      ₹{(item.price * item.qty).toLocaleString("en-IN")}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.name)}
                      className="text-muted-foreground hover:text-destructive transition shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-5 pt-5 border-t border-border/50 flex items-center justify-between gap-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-bold text-lg">₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
                <Link
                  to="/checkout"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-semibold text-sm hover:opacity-90 transition"
                >
                  Checkout <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </section>

      </main>
      <Footer />
    </div>
  );
}
