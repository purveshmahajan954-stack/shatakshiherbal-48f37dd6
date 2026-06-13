import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { adminGet, adminPost, adminPatch, adminDelete } from "@/lib/api-client";
import { Loader2, Search, Plus, Trash2, Pencil, X, Upload, ImageIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/products")({
  component: ProductsPage,
});

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  mrp: number | null;
  stock: number;
  imageUrl: string | null;
  category: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

const emptyForm = { name: "", slug: "", description: "", price: 0, mrp: 0, stock: 0, image_url: "", category: "", active: true };
type FormState = typeof emptyForm;

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [busy, setBusy] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setBusy(true);
    const data = await adminGet<{ products: Product[] }>("/api/admin/products").catch(() => ({ products: [] }));
    setProducts(data.products);
    setBusy(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q));
  }, [products, search]);

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await adminDelete(`/api/admin/products?id=${id}`).catch(() => { toast.error("Delete failed"); return; });
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Deleted");
  };

  const onSave = async (form: FormState) => {
    if (!form.name.trim() || !form.slug.trim()) { toast.error("Name and slug are required"); return; }
    const payload = { name: form.name.trim(), slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"), description: form.description.trim() || null, price: Number(form.price) || 0, mrp: form.mrp ? Number(form.mrp) : null, stock: Number(form.stock) || 0, image_url: form.image_url.trim() || null, category: form.category.trim() || null, active: form.active };
    if (editing) {
      await adminPatch(`/api/admin/products?id=${editing.id}`, payload).catch((e) => { toast.error(e?.message); return; });
      toast.success("Updated");
    } else {
      await adminPost("/api/admin/products", payload).catch((e) => { toast.error(e?.message); return; });
      toast.success("Created");
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add product
        </button>
      </div>

      {busy ? (
        <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center text-muted-foreground text-sm">{products.length === 0 ? 'No products yet. Click "Add product" to create one.' : "No products match your search."}</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Product</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-right px-4 py-3">Price</th>
                  <th className="text-right px-4 py-3">Stock</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-10 h-10 object-cover rounded-md border border-border" /> : <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center"><ImageIcon className="w-4 h-4 text-muted-foreground" /></div>}
                        <div><div className="font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{p.slug}</div></div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{p.category || "—"}</td>
                    <td className="px-4 py-3 text-right">₹{Number(p.price).toLocaleString("en-IN")}{p.mrp ? <div className="text-xs text-muted-foreground line-through">₹{Number(p.mrp).toLocaleString("en-IN")}</div> : null}</td>
                    <td className={`px-4 py-3 text-right ${p.stock === 0 ? "text-red-600 dark:text-red-400 font-medium" : ""}`}>{p.stock}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.active ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300" : "bg-muted text-muted-foreground"}`}>{p.active ? "Active" : "Hidden"}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => { setEditing(p); setShowForm(true); }} className="p-1.5 hover:bg-muted rounded-md"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => remove(p.id)} className="p-1.5 hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-md"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && <ProductForm initial={editing} onCancel={() => { setShowForm(false); setEditing(null); }} onSave={onSave} />}
    </div>
  );
}

function ProductForm({ initial, onCancel, onSave }: { initial: Product | null; onCancel: () => void; onSave: (f: FormState) => void }) {
  const [form, setForm] = useState<FormState>(
    initial ? { name: initial.name, slug: initial.slug, description: initial.description || "", price: initial.price, mrp: initial.mrp ?? 0, stock: initial.stock, image_url: initial.imageUrl || "", category: initial.category || "", active: initial.active } : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [imageTab, setImageTab] = useState<"upload" | "url">("upload");
  const [imagePreview, setImagePreview] = useState<string>(initial?.imageUrl || "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => { e.preventDefault(); setSaving(true); await onSave(form); setSaving(false); };
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((p) => ({ ...p, [k]: v }));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        headers: token ? { "X-Admin-Token": token } : {},
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Upload failed"); return; }
      setImagePreview(data.url);
      set("image_url", data.url);
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    set("image_url", url);
    setImagePreview(url);
  };

  const clearImage = () => {
    set("image_url", "");
    setImagePreview("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto" onClick={onCancel}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-xl w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h3 className="font-display text-lg">{initial ? "Edit product" : "New product"}</h3>
          <button type="button" onClick={onCancel} className="p-1.5 rounded-md hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-xs font-medium block mb-1">Name *</label><input required value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
            <div><label className="text-xs font-medium block mb-1">Slug *</label><input required value={form.slug} onChange={(e) => set("slug", e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
            <div><label className="text-xs font-medium block mb-1">Price (₹) *</label><input required type="number" min={0} value={form.price} onChange={(e) => set("price", Number(e.target.value))} className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
            <div><label className="text-xs font-medium block mb-1">MRP (₹)</label><input type="number" min={0} value={form.mrp} onChange={(e) => set("mrp", Number(e.target.value))} className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
            <div><label className="text-xs font-medium block mb-1">Stock</label><input type="number" min={0} value={form.stock} onChange={(e) => set("stock", Number(e.target.value))} className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
            <div><label className="text-xs font-medium block mb-1">Category</label><input value={form.category} onChange={(e) => set("category", e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-2">Product Image</label>
            <div className="flex gap-2 mb-3">
              <button type="button" onClick={() => setImageTab("upload")} className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${imageTab === "upload" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                <Upload className="w-3 h-3 inline mr-1" />Upload file
              </button>
              <button type="button" onClick={() => setImageTab("url")} className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${imageTab === "url" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                URL
              </button>
            </div>

            {imageTab === "upload" ? (
              <div
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {uploading ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Processing…</div>
                ) : (
                  <div>
                    <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload image</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">JPG, PNG, WEBP · max 2 MB</p>
                  </div>
                )}
              </div>
            ) : (
              <input
                value={form.image_url.startsWith("data:") ? "" : form.image_url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            )}

            {imagePreview && (
              <div className="mt-3 relative inline-block">
                <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-border" onError={() => setImagePreview("")} />
                <button type="button" onClick={clearImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div><label className="text-xs font-medium block mb-1">Description</label><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" /></div>
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="rounded" /> Active (visible to customers)</label>
        </div>
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex gap-2 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2">{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{initial ? "Update" : "Create"}</button>
        </div>
      </form>
    </div>
  );
}
