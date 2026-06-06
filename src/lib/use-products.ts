import { useCallback, useEffect, useState } from "react";
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
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to fetch products");
  const data = await res.json();
  return (data.products as DbProduct[]).map((d) => mergeProduct(d, getProductBySlug(d.slug)));
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
  const [items, setItems] = useState<Product[]>(staticProducts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchProductsFromDb();
      setItems(list.length > 0 ? list : staticProducts);
    } catch {
      setItems(staticProducts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, retry: load };
}
