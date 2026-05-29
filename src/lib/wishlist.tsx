import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type WishlistItem = {
  name: string;
  price: number;
  image?: string;
  slug: string;
};

type WishlistCtx = {
  items: WishlistItem[];
  count: number;
  has: (slug: string) => boolean;
  toggle: (item: WishlistItem) => void;
  add: (item: WishlistItem) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const Ctx = createContext<WishlistCtx | null>(null);
const KEY = "shatakshi_wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const has = (slug: string) => items.some((i) => i.slug === slug);
  const add = (item: WishlistItem) =>
    setItems((prev) => (prev.some((i) => i.slug === item.slug) ? prev : [...prev, item]));
  const remove = (slug: string) => setItems((prev) => prev.filter((i) => i.slug !== slug));
  const toggle = (item: WishlistItem) =>
    setItems((prev) =>
      prev.some((i) => i.slug === item.slug) ? prev.filter((i) => i.slug !== item.slug) : [...prev, item],
    );
  const clear = () => setItems([]);

  return (
    <Ctx.Provider value={{ items, count: items.length, has, toggle, add, remove, clear }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWishlist() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWishlist must be used within WishlistProvider");
  return c;
}
