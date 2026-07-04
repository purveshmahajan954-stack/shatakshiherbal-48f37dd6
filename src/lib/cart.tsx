import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type CartItem = {
  name: string;
  price: number;
  qty: number;
  image?: string;
  slug?: string;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: { name: string; price: number; image?: string; slug?: string }, qty?: number) => void;
  setQty: (name: string, qty: number) => void;
  remove: (name: string) => void;
  clear: () => void;
  updatePrices: (priceMap: Record<string, number>) => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "shatakshi_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

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

  const add: CartCtx["add"] = (item, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.name === item.name);
      if (found) return prev.map((i) => (i.name === item.name ? { ...i, qty: i.qty + qty } : i));
      return [...prev, { ...item, qty }];
    });
  };
  const setQty = (name: string, qty: number) =>
    setItems((prev) =>
      qty <= 0 ? prev.filter((i) => i.name !== name) : prev.map((i) => (i.name === name ? { ...i, qty } : i)),
    );
  const remove = (name: string) => setItems((prev) => prev.filter((i) => i.name !== name));
  const clear = () => setItems([]);
  const updatePrices = (priceMap: Record<string, number>) =>
    setItems((prev) =>
      prev.map((i) =>
        i.slug && priceMap[i.slug] !== undefined ? { ...i, price: priceMap[i.slug] } : i
      )
    );

  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.qty * i.price, 0);

  return (
    <Ctx.Provider value={{ items, count, total, add, setQty, remove, clear, updatePrices }}>{children}</Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}
