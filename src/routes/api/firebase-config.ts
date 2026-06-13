import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/firebase-config")({
  server: {
    handlers: {
      GET: async () => {
        const apiKey = process.env.FIREBASE_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "Firebase not configured" }, { status: 503 });
        }
        return Response.json({
          apiKey,
          authDomain: "shatakshiherbal06.firebaseapp.com",
          projectId: "shatakshiherbal06",
          storageBucket: "shatakshiherbal06.firebasestorage.app",
          messagingSenderId: "946965287166",
          appId: "1:946965287166:web:64485f4b9cb2a3dd4d55af",
        });
      },
    },
  },
});
