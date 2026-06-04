import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@server/admin-auth";

export const Route = createFileRoute("/api/admin/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });
        return Response.json({ admin: { id: admin.id, email: admin.email, fullName: admin.fullName } });
      },
    },
  },
});
