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

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    if (!token) {
      setAdmin(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/me", {
        headers: { "X-Admin-Token": token },
      });
      if (!res.ok) {
        localStorage.removeItem("admin_token");
        setAdmin(null);
      } else {
        const data = await res.json();
        setAdmin(data.admin);
      }
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
    const failsafe = setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(failsafe);
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
    setAdmin(null);
  };

  return (
    <Ctx.Provider value={{ admin, loading, signOut, refreshAdmin: fetchMe }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAdminAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return c;
}
