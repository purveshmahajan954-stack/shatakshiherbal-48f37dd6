import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Plus, Trash2, Pencil, X } from "lucide-react";
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
  image_url: string | null;
  category: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  mrp: 0,
  stock: 0,
  image_url: "",
  category: "",
  active: true,
};
type FormState = typeof emptyForm;

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [busy, setBusy] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setBusy(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load products");
    setProducts((data as Product[]) || []);
    setBusy(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q),
    );
  }, [products, search]);

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error("Delete failed");
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Deleted");
  };

  const onSave = async (form: FormState) => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      description: form.description.trim() || null,
      price: Number(form.price) || 0,
      mrp: form.mrp ? Number(form.mrp) : null,
      stock: Number(form.stock) || 0,
      image_url: form.image_url.trim() || null,
      category: form.category.trim() || null,
      active: form.active,
    };
    if (editing) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Updated");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) return toast.error(error.message);
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
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Add product
        </button>
      </div>

      {busy ? (
        <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center text-muted-foreground text-sm">
          {products.length === 0 ? "No products yet. Click \"Add product\" to create one." : "No products match your search."}
        </div>
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
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover rounded-md border border-border" />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-muted" />
                        )}
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{p.category || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      ₹{Number(p.price).toLocaleString("en-IN")}
                      {p.mrp ? <div className="text-xs text-muted-foreground line-through">₹{Number(p.mrp).toLocaleString("en-IN")}</div> : null}
                    </td>
                    <td className={`px-4 py-3 text-right ${p.stock === 0 ? "text-red-600 dark:text-red-400 font-medium" : ""}`}>{p.stock}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.active ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300" : "bg-muted text-muted-foreground"}`}>
                        {p.active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => { setEditing(p); setShowForm(true); }} className="p-1.5 hover:bg-muted rounded-md" aria-label="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => remove(p.id)} className="p-1.5 hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-md" aria-label="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <ProductForm
          initial={editing}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          onSave={onSave}
        />
      )}
    </div>
  );
}

function ProductForm({ initial, onCancel, onSave }: { initial: Product | null; onCancel: () => void; onSave: (f: FormState) => void }) {
  const [form, setForm] = useState<FormState>(
    initial
      ? {
          name: initial.name,
          slug: initial.slug,
          description: initial.description || "",
          price: initial.price,
          mrp: initial.mrp ?? 0,
          stock: initial.stock,
          image_url: initial.image_url || "",
          category: initial.category || "",
          active: initial.active,
        }
      : emptyForm,
  );
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto" onClick={onCancel}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-xl w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h3 className="font-display text-lg">{initial ? "Edit product" : "New product"}</h3>
          <button type="button" onClick={onCancel} className="p-1.5 rounded-md hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name" required>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} required className="input" />
            </Field>
            <Field label="Slug" required>
              <input value={form.slug} onChange={(e) => set("slug", e.target.value)} required placeholder="my-product" className="input" />
            </Field>
          </div>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="input" />
          </Field>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Price (₹)" required>
              <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", Number(e.target.value))} required className="input" />
            </Field>
            <Field label="MRP (₹)">
              <input type="number" min="0" step="0.01" value={form.mrp} onChange={(e) => set("mrp", Number(e.target.value))} className="input" />
            </Field>
            <Field label="Stock">
              <input type="number" min="0" step="1" value={form.stock} onChange={(e) => set("stock", Number(e.target.value))} className="input" />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Category">
              <input value={form.category} onChange={(e) => set("category", e.target.value)} className="input" />
            </Field>
            <Field label="Image URL">
              <input value={form.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="https://…" className="input" />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
            Active (visible to customers)
          </label>
        </div>
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60 inline-flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {initial ? "Save changes" : "Create product"}
          </button>
        </div>
      </form>
      <style>{`.input{width:100%;padding:.5rem .75rem;font-size:.875rem;border:1px solid var(--border);border-radius:.5rem;background:var(--background);color:var(--foreground);outline:none}.input:focus{box-shadow:0 0 0 2px color-mix(in oklab,var(--primary) 30%,transparent)}`}</style>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground block mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
