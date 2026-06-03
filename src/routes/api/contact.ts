import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { contactMessages } from "@shared/schema";

export const Route = createFileRoute("/api/contact")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

        const { name, email, phone, message } = body ?? {};
        if (!name?.trim() || !email?.trim() || !message?.trim()) {
          return Response.json({ error: "Name, email, and message are required" }, { status: 400 });
        }
        if (name.trim().length > 200 || email.trim().length > 320 || message.trim().length > 5000) {
          return Response.json({ error: "Input too long" }, { status: 400 });
        }

        await db.insert(contactMessages).values({
          name: name.trim(),
          email: email.trim(),
          phone: phone?.trim() || null,
          message: message.trim(),
        });

        return Response.json({ ok: true });
      },
    },
  },
});
