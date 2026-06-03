import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { adminSessions } from "@shared/schema";
import { eq } from "drizzle-orm";

export const Route = createFileRoute("/api/admin/signout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("x-admin-token");
        if (token) {
          await db.delete(adminSessions).where(eq(adminSessions.token, token)).catch(() => {});
        }
        return Response.json({ ok: true });
      },
    },
  },
});
