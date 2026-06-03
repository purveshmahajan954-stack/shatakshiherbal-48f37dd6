import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/payments/razorpay-key")({
  server: {
    handlers: {
      GET: async () => {
        const id = process.env.RAZORPAY_KEY_ID;
        if (!id) return Response.json({ error: "Razorpay not configured" }, { status: 500 });
        return Response.json({ keyId: id });
      },
    },
  },
});
