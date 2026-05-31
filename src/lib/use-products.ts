import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { products as staticProducts, getProductBySlug, type Product } from "./products";
import productPlaceholder from "@/assets/product-1.webp";

export type DbProduct = {
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
};

const DEFAULTS = {
  rating: 4.7,
  reviews: 120,
  badge: null as string | null,
  badgeColor: "",
  discount: 0,
  category: "Ayurvedic Tablets / Medicines",
  benefits: [
    "100% natural and AYUSH certified ingredients",
    "Traditional Ayurvedic formulation",
    "No artificial preservatives or chemicals",
    "Safe for daily use with no side effects",
  ],
  usage: "Take 1-2 capsules twice daily after meals with warm water, or as directed by your physician.",
  ingredients: "A proprietary blend of authentic Ayurvedic herbs including traditional rasayanas, processed as per classical texts.",
  categories: [] as string[],
};

/** Merge a DB row over a matching static catalog entry. DB-only fields fall back to defaults. */
export function mergeProduct(db: DbProduct, stat?: Product): Product {
  const base = stat ?? null;
  return {
    slug: db.slug,
    name: db.name,
    image: db.image_url || base?.image || productPlaceholder,
    desc: db.description || base?.desc || "",
    longDesc: base?.longDesc || (db.description || ""),
    price: Number(db.price) || 0,
    oldPrice: db.mrp != null ? Number(db.mrp) : base?.oldPrice ?? 0,
    save: (db.mrp != null ? Number(db.mrp) : base?.oldPrice ?? 0) - (Number(db.price) || 0),
    rating: base?.rating ?? DEFAULTS.rating,
    reviews: base?.reviews ?? DEFAULTS.reviews,
    badge: base?.badge ?? (db.stock === 0 ? "OUT OF STOCK" : null),
    badgeColor: base?.badgeColor ?? "bg-muted",
    discount: base?.discount ?? 0,
    category: base?.category ?? DEFAULTS.category,
    benefits: base?.benefits ?? DEFAULTS.benefits,
    usage: base?.usage ?? DEFAULTS.usage,
    ingredients: base?.ingredients ?? DEFAULTS.ingredients,
    categories: base?.categories ?? (db.category ? [db.category] : DEFAULTS.categories),
  };
}

export async function fetchProductsFromDb(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as DbProduct[]).map((d) => mergeProduct(d, getProductBySlug(d.slug)));
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const stat = getProductBySlug(slug);
    return stat ?? null;
  }
  return mergeProduct(data as DbProduct, getProductBySlug(slug));
}

export function useProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchProductsFromDb();
        if (!cancelled) setItems(list);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load products");
          // Fallback to static so the site never goes blank
          setItems(staticProducts);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading, error };
}
