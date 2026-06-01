import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/track-order")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const trackingId = url.searchParams.get("tracking_id");
        if (!trackingId || trackingId.length > 32) {
          return Response.json({ error: "Missing tracking_id" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
          .from("orders")
          .select("tracking_id, tracking_status, tracking_location, tracking_eta, tracking_updated_at, created_at, items, total")
          .eq("tracking_id", trackingId)
          .maybeSingle();

        if (error || !data) {
          return Response.json({ error: "Order not found" }, { status: 404 });
        }

        return Response.json({
          tracking_id: data.tracking_id,
          status: data.tracking_status ?? "Order Placed",
          location: data.tracking_location ?? null,
          eta: data.tracking_eta ?? null,
          updated_at: data.tracking_updated_at,
          placed_at: data.created_at,
          items: data.items,
          total: data.total,
        });
      },
    },
  },
});
