import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { products } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@server/admin-auth";

export const Route = createFileRoute("/api/admin/products")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const rows = await db.select().from(products).orderBy(desc(products.createdAt));
        return Response.json({ products: rows });
      },
      POST: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

        if (!body.name?.trim() || !body.slug?.trim()) return Response.json({ error: "Name and slug required" }, { status: 400 });

        const [product] = await db.insert(products).values({
          name: body.name.trim(),
          slug: body.slug.trim().toLowerCase().replace(/\s+/g, "-"),
          description: body.description?.trim() || null,
          price: String(Number(body.price) || 0),
          mrp: body.mrp ? String(Number(body.mrp)) : null,
          stock: Number(body.stock) || 0,
          imageUrl: body.image_url?.trim() || null,
          galleryImages: Array.isArray(body.gallery_images) ? body.gallery_images : [],
          category: body.category?.trim() || null,
          active: body.active ?? true,
        }).returning();

        return Response.json({ product });
      },
      PATCH: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

        await db.update(products).set({
          name: body.name?.trim(),
          slug: body.slug?.trim().toLowerCase().replace(/\s+/g, "-"),
          description: body.description?.trim() || null,
          price: String(Number(body.price) || 0),
          mrp: body.mrp ? String(Number(body.mrp)) : null,
          stock: Number(body.stock) || 0,
          imageUrl: body.image_url?.trim() || null,
          galleryImages: Array.isArray(body.gallery_images) ? body.gallery_images : [],
          category: body.category?.trim() || null,
          active: body.active,
          updatedAt: new Date(),
        }).where(eq(products.id, id));

        return Response.json({ ok: true });
      },
      DELETE: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

        await db.delete(products).where(eq(products.id, id));
        return Response.json({ ok: true });
      },
    },
  },
});
