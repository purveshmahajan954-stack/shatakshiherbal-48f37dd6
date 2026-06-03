import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { userSessions } from "@shared/schema";
import { eq } from "drizzle-orm";

export const Route = createFileRoute("/api/auth/signout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
        if (token) {
          await db.delete(userSessions).where(eq(userSessions.token, token)).catch(() => {});
        }
        return Response.json({ ok: true });
      },
    },
  },
});
