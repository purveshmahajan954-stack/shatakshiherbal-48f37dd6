import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { profiles, userSessions } from "@shared/schema";
import type { SavedAddress } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import { randomUUID } from "crypto";

async function requireUser(request: Request) {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  const rows = await db
    .select({ profile: profiles })
    .from(userSessions)
    .innerJoin(profiles, eq(userSessions.profileId, profiles.id))
    .where(and(eq(userSessions.token, token), gt(userSessions.expiresAt, new Date())))
    .limit(1);
  return rows[0]?.profile ?? null;
}

export const Route = createFileRoute("/api/user/addresses")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await requireUser(request);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const addresses = (user.savedAddresses as SavedAddress[]) ?? [];
        return Response.json({ addresses });
      },

      POST: async ({ request }) => {
        const user = await requireUser(request);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json() as Partial<SavedAddress>;
        if (!body.flatHouse?.trim()) return Response.json({ error: "Address is required" }, { status: 400 });
        if (!body.pincode || body.pincode.length !== 6) return Response.json({ error: "Valid pincode required" }, { status: 400 });

        const current = ((user.savedAddresses as SavedAddress[]) ?? []);
        const newAddr: SavedAddress = {
          id: randomUUID(),
          label: (body.label ?? "Home").trim().slice(0, 30),
          flatHouse: body.flatHouse.trim().slice(0, 200),
          areaStreet: (body.areaStreet ?? "").trim().slice(0, 200),
          landmark: (body.landmark ?? "").trim().slice(0, 100) || undefined,
          district: (body.district ?? "").trim().slice(0, 100),
          pincode: body.pincode.trim(),
          city: (body.city ?? "").trim().slice(0, 100),
          state: (body.state ?? "").trim().slice(0, 100),
          isDefault: current.length === 0 ? true : !!body.isDefault,
        };

        let updated = [...current];
        if (newAddr.isDefault) updated = updated.map(a => ({ ...a, isDefault: false }));
        updated.push(newAddr);

        await db.update(profiles).set({ savedAddresses: updated, updatedAt: new Date() }).where(eq(profiles.id, user.id));
        return Response.json({ address: newAddr });
      },

      PUT: async ({ request }) => {
        const user = await requireUser(request);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

        const body = await request.json() as Partial<SavedAddress>;
        const current = ((user.savedAddresses as SavedAddress[]) ?? []);
        const idx = current.findIndex(a => a.id === id);
        if (idx === -1) return Response.json({ error: "Address not found" }, { status: 404 });

        let updated = current.map(a => {
          if (a.id !== id) return body.isDefault ? { ...a, isDefault: false } : a;
          return {
            ...a,
            label: (body.label ?? a.label).trim().slice(0, 30),
            flatHouse: (body.flatHouse ?? a.flatHouse).trim().slice(0, 200),
            areaStreet: (body.areaStreet ?? a.areaStreet).trim().slice(0, 200),
            landmark: ((body.landmark ?? a.landmark ?? "").trim().slice(0, 100)) || undefined,
            district: (body.district ?? a.district).trim().slice(0, 100),
            pincode: (body.pincode ?? a.pincode).trim(),
            city: (body.city ?? a.city).trim().slice(0, 100),
            state: (body.state ?? a.state).trim().slice(0, 100),
            isDefault: !!body.isDefault,
          } as SavedAddress;
        });

        await db.update(profiles).set({ savedAddresses: updated, updatedAt: new Date() }).where(eq(profiles.id, user.id));
        return Response.json({ ok: true });
      },

      DELETE: async ({ request }) => {
        const user = await requireUser(request);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

        const current = ((user.savedAddresses as SavedAddress[]) ?? []);
        let updated = current.filter(a => a.id !== id);
        if (updated.length > 0 && !updated.some(a => a.isDefault)) {
          updated[0] = { ...updated[0], isDefault: true };
        }

        await db.update(profiles).set({ savedAddresses: updated, updatedAt: new Date() }).where(eq(profiles.id, user.id));
        return Response.json({ ok: true });
      },
    },
  },
});
