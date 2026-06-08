import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { sql } from "drizzle-orm";

export const Route = createFileRoute("/api/admin/migrate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = request.headers.get("x-migrate-secret");
        if (secret !== "shatakshi-migrate-2026") {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        try {
          const results: string[] = [];

          await db.execute(sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address text`);
          results.push("profiles.address column: OK");

          return Response.json({ ok: true, results });
        } catch (err: any) {
          return Response.json({ error: err.message }, { status: 500 });
        }
      },
    },
  },
});
