import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { products } from "@shared/schema";
import { eq } from "drizzle-orm";

export const Route = createFileRoute("/api/products")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const slug = url.searchParams.get("slug");

        if (slug) {
          const rows = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
          return Response.json({ product: rows[0] ?? null });
        }

        const rows = await db.select().from(products).where(eq(products.active, true));
        return Response.json({ products: rows });
      },
    },
  },
});
