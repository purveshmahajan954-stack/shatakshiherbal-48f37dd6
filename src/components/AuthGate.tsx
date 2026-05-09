import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { LoginScreen } from "@/components/LoginScreen";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;
  return <>{children}</>;
}
