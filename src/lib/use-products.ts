import { useEffect, useState } from "react";
import { products as staticProducts, getProductBySlug, type Product } from "./products";
const productPlaceholder = "https://images.pexels.com/photos/6692133/pexels-photo-6692133.jpeg?auto=compress&cs=tinysrgb&w=600";

export type DbProduct = {
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

export function mergeProduct(db: DbProduct, stat?: Product): Product {
  const base = stat ?? null;
  return {
    slug: db.slug,
    name: db.name,
    image: db.imageUrl || base?.image || productPlaceholder,
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
  try {
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error("Failed to fetch products");
    const data = await res.json();
    return (data.products as DbProduct[]).map((d) => mergeProduct(d, getProductBySlug(d.slug)));
  } catch {
    return staticProducts;
  }
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`/api/products?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) return getProductBySlug(slug) ?? null;
    const data = await res.json();
    if (!data.product) return getProductBySlug(slug) ?? null;
    return mergeProduct(data.product as DbProduct, getProductBySlug(slug));
  } catch {
    return getProductBySlug(slug) ?? null;
  }
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
          setItems(staticProducts);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { items, loading, error };
}
