import { createFileRoute } from "@tanstack/react-router";
import { generateToken } from "@server/password";

export const Route = createFileRoute("/api/auth/google")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
          return Response.json({ error: "Google OAuth not configured" }, { status: 503 });
        }

        const origin = new URL(request.url).origin;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${origin}/api/auth/google-callback`;
        const state = generateToken();

        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: "openid email profile",
          access_type: "offline",
          prompt: "select_account",
          state,
        });

        const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

        return new Response(null, {
          status: 302,
          headers: {
            Location: googleUrl,
            "Set-Cookie": `google_oauth_state=${state}; Path=/; Max-Age=600; SameSite=Lax; HttpOnly`,
          },
        });
      },
    },
  },
});
