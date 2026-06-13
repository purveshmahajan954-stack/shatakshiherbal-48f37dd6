import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { profiles, userRoles, userSessions } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const auth = request.headers.get("authorization");
          const cookieHeader = request.headers.get("cookie") ?? "";
          let token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
          if (!token) {
            const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/);
            token = match?.[1] ?? null;
          }
          if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

          const now = new Date();
          const rows = await db
            .select({ profile: profiles })
            .from(userSessions)
            .innerJoin(profiles, eq(userSessions.profileId, profiles.id))
            .where(and(eq(userSessions.token, token), gt(userSessions.expiresAt, now)))
            .limit(1);

          if (rows.length === 0) return Response.json({ error: "Unauthorized" }, { status: 401 });

          const profile = rows[0].profile as any;
          const roleRows = await db
            .select({ role: userRoles.role })
            .from(userRoles)
            .where(eq(userRoles.userId, profile.id));
          const isAdmin = roleRows.some((r) => r.role === "admin");

          return Response.json({
            user: {
              id: profile.id,
              email: profile.email,
              phone: profile.phone,
              fullName: profile.fullName,
              avatarUrl: profile.avatarUrl,
              address: profile.address ?? null,
              savedAddresses: (profile as any).savedAddresses ?? [],
              hasPassword: !!(profile.passwordHash ?? profile.password_hash),
            },
            isAdmin,
          });
        } catch (err: any) {
          console.error("[me]", err);
          return Response.json({ error: "Internal error" }, { status: 500 });
        }
      },
    },
  },
});
