import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { profiles, adminSessions, userRoles } from "@shared/schema";
import { eq } from "drizzle-orm";
import { generateToken } from "@server/password";
import { verifyFirebaseIdToken } from "@server/firebase";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const last10 = (p: string) => p.replace(/\D/g, "").slice(-10);

export const Route = createFileRoute("/api/admin/firebase-phone-verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any;
        try { body = await request.json(); } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const { idToken } = body ?? {};
        if (!idToken || typeof idToken !== "string") {
          return Response.json({ error: "idToken is required" }, { status: 400 });
        }

        const firebaseUser = await verifyFirebaseIdToken(idToken);
        if (!firebaseUser) {
          return Response.json({ error: "Invalid or expired token" }, { status: 401 });
        }

        const phone = firebaseUser.phone;
        if (!phone) {
          return Response.json({ error: "No phone number in token" }, { status: 400 });
        }

        const phoneLast10 = last10(phone);
        const adminPhoneEnv = process.env.ADMIN_PHONE?.trim();

        console.log(`[AdminOTP] verified phone: ${phone} (last10: ${phoneLast10}), ADMIN_PHONE: ${adminPhoneEnv ? "set" : "not set"}`);

        if (adminPhoneEnv) {
          // ADMIN_PHONE is set — compare last 10 digits (handles +91, 91, or 10-digit formats)
          const adminLast10 = last10(adminPhoneEnv);
          console.log(`[AdminOTP] comparing phoneLast10=${phoneLast10} vs adminLast10=${adminLast10}`);
          if (adminLast10.length !== 10 || phoneLast10 !== adminLast10) {
            return Response.json({ error: "This phone number is not authorized as admin" }, { status: 403 });
          }
        } else {
          // No ADMIN_PHONE env — fall back to DB admin role check
          const profileRows = await db
            .select({ id: profiles.id })
            .from(profiles)
            .where(eq(profiles.phone, phone))
            .limit(1);

          if (profileRows.length === 0) {
            return Response.json({ error: "No admin account found for this phone" }, { status: 403 });
          }

          const roleRows = await db
            .select({ role: userRoles.role })
            .from(userRoles)
            .where(eq(userRoles.userId, profileRows[0].id));

          const isAdmin = roleRows.some((r) => r.role === "admin");
          if (!isAdmin) {
            return Response.json({ error: "This phone number is not authorized as admin" }, { status: 403 });
          }
        }

        // Auth passed — find or create admin profile
        let existing = await db
          .select()
          .from(profiles)
          .where(eq(profiles.phone, phone))
          .limit(1);

        let profile: typeof profiles.$inferSelect;
        if (existing.length > 0) {
          profile = existing[0];
        } else {
          const [created] = await db
            .insert(profiles)
            .values({ phone, fullName: "Admin" })
            .returning();
          await db.insert(userRoles).values({ userId: created.id, role: "admin" });
          profile = created;
        }

        const token = generateToken();
        const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
        await db.insert(adminSessions).values({ token, profileId: profile.id, expiresAt });

        return Response.json({
          token,
          admin: { id: profile.id, phone: profile.phone, fullName: profile.fullName },
        });
      },
    },
  },
});
