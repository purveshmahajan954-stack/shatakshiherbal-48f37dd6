import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type AdminUser = {
  id: string;
  email: string | null;
  fullName: string | null;
};

type AdminCtx = {
  admin: AdminUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
};

const Ctx = createContext<AdminCtx | null>(null);

const CACHE_KEY = "admin_data";

function readCachedAdmin(): AdminUser | null {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem("admin_token");
    if (!token) return null;
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

function saveCachedAdmin(admin: AdminUser | null) {
  if (typeof window === "undefined") return;
  if (admin) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(admin));
  } else {
    localStorage.removeItem(CACHE_KEY);
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMe = async (background = false) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    if (!token) {
      setAdmin(null);
      saveCachedAdmin(null);
      if (!background) setLoading(false);
      return;
    }
    if (!background) setLoading(true);
    try {
      const res = await fetch("/api/admin/me", {
        headers: { "X-Admin-Token": token },
      });
      if (!res.ok) {
        localStorage.removeItem("admin_token");
        saveCachedAdmin(null);
        setAdmin(null);
      } else {
        const data = await res.json();
        saveCachedAdmin(data.admin);
        setAdmin(data.admin);
      }
    } catch {
      // Network error — keep cached state so panel stays open
    } finally {
      if (!background) setLoading(false);
    }
  };

  useEffect(() => {
    const cached = readCachedAdmin();
    if (cached) {
      // Already showing cached admin — silently verify in background
      fetchMe(true);
    } else {
      // No cache — must fetch (will show spinner only here)
      fetchMe(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      await fetch("/api/admin/signout", {
        method: "POST",
        headers: { "X-Admin-Token": token },
      }).catch(() => {});
    }
    localStorage.removeItem("admin_token");
    saveCachedAdmin(null);
    setAdmin(null);
  };

  return (
    <Ctx.Provider value={{ admin, loading, signOut, refreshAdmin: () => fetchMe(false) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAdminAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return c;
}
