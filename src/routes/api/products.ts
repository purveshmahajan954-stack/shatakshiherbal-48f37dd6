import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { products } from "@shared/schema";
import { eq } from "drizzle-orm";

const NO_CACHE = "no-store, no-cache, must-revalidate";

export const Route = createFileRoute("/api/products")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const slug = url.searchParams.get("slug");

        if (slug) {
          const rows = await db
            .select({
              id: products.id,
              name: products.name,
              slug: products.slug,
              description: products.description,
              price: products.price,
              mrp: products.mrp,
              stock: products.stock,
              imageUrl: products.imageUrl,
              galleryImages: products.galleryImages,
              category: products.category,
              active: products.active,
            })
            .from(products)
            .where(eq(products.slug, slug))
            .limit(1);
          return new Response(JSON.stringify({ product: rows[0] ?? null }), {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": NO_CACHE,
            },
          });
        }

        const rows = await db
          .select({
            id: products.id,
            name: products.name,
            slug: products.slug,
            description: products.description,
            price: products.price,
            mrp: products.mrp,
            stock: products.stock,
            imageUrl: products.imageUrl,
            galleryImages: products.galleryImages,
            category: products.category,
            active: products.active,
          })
          .from(products)
          .where(eq(products.active, true));

        return new Response(JSON.stringify({ products: rows }), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": NO_CACHE,
          },
        });
      },
    },
  },
});
