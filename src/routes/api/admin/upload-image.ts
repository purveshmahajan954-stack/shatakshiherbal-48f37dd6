import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@server/admin-auth";

async function uploadToImgBB(file: File, apiKey: string): Promise<string> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const form = new FormData();
  form.append("key", apiKey);
  form.append("image", base64);

  const res = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ImgBB error ${res.status}: ${text}`);
  }

  const json = await res.json() as { data?: { url?: string }; success?: boolean };
  const url = json?.data?.url;
  if (!url) throw new Error("ImgBB returned no URL");
  return url;
}

async function uploadToFilesystem(file: File): Promise<string> {
  const { writeFile, mkdir } = await import("fs/promises");
  const { join } = await import("path");
  const { randomUUID } = await import("crypto");

  const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = join(process.cwd(), "public", "product-images");

  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(uploadDir, filename), buffer);

  return `/product-images/${filename}`;
}

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

        const imgbbKey = process.env.IMGBB_API_KEY;

        try {
          if (imgbbKey) {
            const url = await uploadToImgBB(file, imgbbKey);
            return Response.json({ url });
          } else {
            const url = await uploadToFilesystem(file);
            return Response.json({ url });
          }
        } catch (err: any) {
          console.error("Upload error:", err?.message || err);
          return Response.json({ error: "Upload failed: " + (err?.message || "unknown error") }, { status: 500 });
        }
      },
    },
  },
});
