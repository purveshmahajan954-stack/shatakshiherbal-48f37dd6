import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Leaf, Loader2 } from "lucide-react";

type AuthCallbackSearch = { token?: string; error?: string };

export const Route = createFileRoute("/auth-callback")({
  validateSearch: (s: Record<string, unknown>): AuthCallbackSearch => ({
    token: typeof s.token === "string" ? s.token : undefined,
    error: typeof s.error === "string" ? s.error : undefined,
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const { token, error } = Route.useSearch();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      navigate({ to: "/login", search: { error } as any });
      return;
    }
    if (token) {
      localStorage.setItem("auth_token", token);
      const maxAge = 7 * 24 * 60 * 60;
      document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
      refreshUser().then(() => {
        navigate({ to: "/" });
      });
    } else {
      navigate({ to: "/login" });
    }
  }, [token, error]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
          <Leaf className="w-7 h-7 text-primary" />
        </div>
        <p className="text-muted-foreground flex items-center gap-2 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Signing you in…
        </p>
      </div>
    </div>
  );
}
