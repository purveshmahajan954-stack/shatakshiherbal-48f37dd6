import { useCallback, useEffect, useRef, useState } from "react";
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

const CACHE_TTL = 5 * 1000;
let _cache: { data: Product[]; at: number } | null = null;
let _inflight: Promise<Product[]> | null = null;

export function clearProductCache() {
  _cache = null;
  _inflight = null;
}

function isCacheFresh() {
  return _cache !== null && Date.now() - _cache.at < CACHE_TTL;
}

export async function fetchProductsFromDb(): Promise<Product[]> {
  if (isCacheFresh()) return _cache!.data;
  if (_inflight) return _inflight;

  _inflight = fetch("/api/products", {
    cache: "no-store",
    headers: { Accept: "application/json" },
  })
    .then(async (res) => {
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      const list = (data.products as DbProduct[]).map((d) =>
        mergeProduct(d, getProductBySlug(d.slug))
      );
      _cache = { data: list, at: Date.now() };
      return list;
    })
    .finally(() => { _inflight = null; });

  return _inflight;
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    if (isCacheFresh()) {
      const hit = _cache!.data.find((p) => p.slug === slug);
      if (hit) return hit;
    }
    const res = await fetch(`/api/products?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const list = await fetchProductsFromDb();
      if (!mounted.current) return;
      setItems(list.length > 0 ? list : staticProducts);
    } catch {
      if (!mounted.current) return;
      setItems(staticProducts);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (isCacheFresh()) {
      setItems(_cache!.data.length > 0 ? _cache!.data : staticProducts);
    } else {
      load(false);
    }
    return () => { mounted.current = false; };
  }, [load]);

  return { items, loading, error, retry: () => load(true) };
}
