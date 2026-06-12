import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@server/admin-auth";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export const Route = createFileRoute("/api/admin/upload-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const formData = await request.formData().catch(() => null);
        if (!formData) return Response.json({ error: "Invalid form data" }, { status: 400 });

        const file = formData.get("image") as File | null;
        if (!file || typeof file === "string") return Response.json({ error: "No image file provided" }, { status: 400 });

        if (file.size > 5 * 1024 * 1024) return Response.json({ error: "Image must be under 5 MB" }, { status: 400 });

        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) return Response.json({ error: "Only JPG, PNG, WEBP, GIF allowed" }, { status: 400 });

        const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
        const filename = `${randomUUID()}.${ext}`;
        const uploadDir = join(process.cwd(), "public", "product-images");
        const filePath = join(uploadDir, filename);

        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);

        return Response.json({ url: `/product-images/${filename}` });
      },
    },
  },
});
