import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const applySession = (sess: Session | null) => {
      if (!mounted) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      setLoading(false);
      if (sess?.user) {
        // defer role fetch to avoid deadlock with auth listener
        setTimeout(async () => {
          try {
            const { data } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", sess.user.id)
              .eq("role", "admin")
              .maybeSingle();
            if (mounted) setIsAdmin(!!data);
          } catch {
            if (mounted) setIsAdmin(false);
          }
        }, 0);
      } else {
        setIsAdmin(false);
      }
    };

    // Listener first so we never miss an event during init.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_e, sess) => applySession(sess)
    );

    // Initial session restore. Catch errors and force-resolve loading state
    // so mobile browsers with flaky storage/network can't get stuck on a
    // "Loading…" screen forever.
    supabase.auth
      .getSession()
      .then(({ data: { session: sess } }) => applySession(sess))
      .catch(() => {
        if (mounted) setLoading(false);
      });

    // Hard safety net: never leave the app in a perpetual loading state.
    const failsafe = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 4000);

    return () => {
      mounted = false;
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ user, session, isAdmin, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
