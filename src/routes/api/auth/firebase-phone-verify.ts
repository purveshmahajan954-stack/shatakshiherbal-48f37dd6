import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { profiles, userRoles, userSessions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { generateToken } from "@server/password";
import { verifyFirebaseIdToken } from "@server/firebase";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export const Route = createFileRoute("/api/auth/firebase-phone-verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any;
        try { body = await request.json(); } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const { idToken, fullName } = body ?? {};
        if (!idToken || typeof idToken !== "string") {
          return Response.json({ error: "idToken is required" }, { status: 400 });
        }

        const firebaseUser = await verifyFirebaseIdToken(idToken);
        if (!firebaseUser) {
          return Response.json({ error: "Invalid or expired token" }, { status: 401 });
        }

        const phone = firebaseUser.phone;
        if (!phone) {
          return Response.json({ error: "No phone number in token" }, { status: 400 });
        }

        let existing = await db
          .select()
          .from(profiles)
          .where(eq(profiles.phone, phone))
          .limit(1);

        let profile: typeof profiles.$inferSelect;

        if (existing.length > 0) {
          profile = existing[0];
        } else {
          const name = typeof fullName === "string" && fullName.trim() ? fullName.trim() : null;
          const [created] = await db
            .insert(profiles)
            .values({ phone, fullName: name })
            .returning();
          await db.insert(userRoles).values({ userId: created.id, role: "user" });
          profile = created;
        }

        const token = generateToken();
        const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
        await db.insert(userSessions).values({ token, profileId: profile.id, expiresAt });

        const cookieMaxAge = Math.floor(SESSION_DURATION_MS / 1000);

        return new Response(
          JSON.stringify({
            token,
            user: {
              id: profile.id,
              email: profile.email,
              phone: profile.phone,
              fullName: profile.fullName,
            },
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie": `auth_token=${token}; Path=/; Max-Age=${cookieMaxAge}; SameSite=Lax`,
            },
          }
        );
      },
    },
  },
});
