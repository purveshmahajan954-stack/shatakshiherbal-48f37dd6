import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type AppUser = {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  address: string | null;
  hasPassword: boolean;
};

type AuthCtx = {
  user: AppUser | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        localStorage.removeItem("auth_token");
        document.cookie = "auth_token=; path=/; max-age=0";
        setUser(null);
        setIsAdmin(false);
      } else {
        const data = await res.json();
        setUser(data.user);
        setIsAdmin(data.isAdmin ?? false);
        const maxAge = 7 * 24 * 60 * 60;
        document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
      }
    } catch {
      setUser(null);
      setIsAdmin(false);
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
    const token = localStorage.getItem("auth_token");
    if (token) {
      await fetch("/api/auth/signout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem("auth_token");
    document.cookie = "auth_token=; path=/; max-age=0";
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <Ctx.Provider value={{ user, isAdmin, loading, signOut, refreshUser: fetchMe }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
