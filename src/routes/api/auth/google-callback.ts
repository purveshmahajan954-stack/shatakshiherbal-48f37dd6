import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { profiles, userRoles, userSessions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { generateToken } from "@server/password";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function parseCookies(cookieHeader: string): Record<string, string> {
  return Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...rest] = c.trim().split("=");
      return [k.trim(), rest.join("=").trim()];
    })
  );
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

export const Route = createFileRoute("/api/auth/google-callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");
        const origin = url.origin;

        if (error || !code) {
          return new Response(null, {
            status: 302,
            headers: { Location: `${origin}/login?error=google_cancelled` },
          });
        }

        const cookieHeader = request.headers.get("cookie") ?? "";
        const cookies = parseCookies(cookieHeader);
        const savedState = cookies["google_oauth_state"];

        if (!savedState || savedState !== state) {
          return new Response(null, {
            status: 302,
            headers: { Location: `${origin}/login?error=google_state_mismatch` },
          });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
          return new Response(null, {
            status: 302,
            headers: { Location: `${origin}/login?error=google_not_configured` },
          });
        }

        const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${origin}/api/auth/google-callback`;

        try {
          const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: redirectUri,
              grant_type: "authorization_code",
            }),
          });

          if (!tokenRes.ok) {
            console.error("[google-callback] Token exchange failed:", await tokenRes.text());
            return new Response(null, {
              status: 302,
              headers: { Location: `${origin}/login?error=google_token_failed` },
            });
          }

          const tokenData = (await tokenRes.json()) as { access_token: string };

          const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });

          if (!userInfoRes.ok) {
            return new Response(null, {
              status: 302,
              headers: { Location: `${origin}/login?error=google_userinfo_failed` },
            });
          }

          const googleUser = (await userInfoRes.json()) as GoogleUserInfo;
          const email = googleUser.email?.toLowerCase().trim();

          if (!email) {
            return new Response(null, {
              status: 302,
              headers: { Location: `${origin}/login?error=google_no_email` },
            });
          }

          let profile: typeof profiles.$inferSelect | undefined;

          const byGoogleId = await db
            .select()
            .from(profiles)
            .where(eq(profiles.googleId, googleUser.id))
            .limit(1);

          if (byGoogleId.length > 0) {
            profile = byGoogleId[0];
            await db
              .update(profiles)
              .set({ avatarUrl: googleUser.picture, updatedAt: new Date() })
              .where(eq(profiles.id, profile.id));
          } else {
            const byEmail = await db
              .select()
              .from(profiles)
              .where(eq(profiles.email, email))
              .limit(1);

            if (byEmail.length > 0) {
              profile = byEmail[0];
              await db
                .update(profiles)
                .set({
                  googleId: googleUser.id,
                  avatarUrl: googleUser.picture,
                  fullName: profile.fullName ?? googleUser.name,
                  updatedAt: new Date(),
                })
                .where(eq(profiles.id, profile.id));
            } else {
              const [created] = await db
                .insert(profiles)
                .values({
                  email,
                  googleId: googleUser.id,
                  fullName: googleUser.name,
                  avatarUrl: googleUser.picture,
                })
                .returning();
              await db.insert(userRoles).values({ userId: created.id, role: "user" });
              profile = created;
            }
          }

          const token = generateToken();
          const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
          await db.insert(userSessions).values({ token, profileId: profile.id, expiresAt });

          const cookieMaxAge = Math.floor(SESSION_DURATION_MS / 1000);
          return new Response(null, {
            status: 302,
            headers: {
              Location: `${origin}/auth-callback?token=${token}`,
              "Set-Cookie": [
                `auth_token=${token}; Path=/; Max-Age=${cookieMaxAge}; SameSite=Lax`,
                `google_oauth_state=; Path=/; Max-Age=0`,
              ].join(", "),
            },
          });
        } catch (err: any) {
          console.error("[google-callback]", err);
          return new Response(null, {
            status: 302,
            headers: { Location: `${origin}/login?error=google_server_error` },
          });
        }
      },
    },
  },
});
