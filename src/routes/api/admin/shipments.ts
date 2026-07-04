import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { orders } from "@shared/schema";
import { eq, desc, ne } from "drizzle-orm";
import { requireAdmin } from "@server/admin-auth";
import {
  createCKShipShipment,
  trackCKShipShipment,
  getCKShipLabel,
  cancelCKShipShipment,
} from "@server/ckship";
import { sendSMS, smsShipmentCreated } from "@server/notify";

export const Route = createFileRoute("/api/admin/shipments")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const rows = await db
          .select({
            id: orders.id,
            shippingName: orders.shippingName,
            shippingPhone: orders.shippingPhone,
            shippingAddress: orders.shippingAddress,
            email: orders.email,
            total: orders.total,
            paymentStatus: orders.paymentStatus,
            status: orders.status,
            trackingId: orders.trackingId,
            trackingStatus: orders.trackingStatus,
            trackingLocation: orders.trackingLocation,
            trackingEta: orders.trackingEta,
            ckshipShipmentId: orders.ckshipShipmentId,
            ckshipOrderNumber: orders.ckshipOrderNumber,
            awbNumber: orders.awbNumber,
            courierName: orders.courierName,
            shippingCost: orders.shippingCost,
            labelUrl: orders.labelUrl,
            shipmentStatus: orders.shipmentStatus,
            paymentMethod: orders.paymentMethod,
            items: orders.items,
            createdAt: orders.createdAt,
          })
          .from(orders)
          .orderBy(desc(orders.createdAt))
          .limit(500);

        return Response.json({ shipments: rows });
      },

      POST: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

        const orderId = body?.order_id;
        if (!orderId) return Response.json({ error: "Missing order_id" }, { status: 400 });

        const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
        if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

        try {
          const result = await createCKShipShipment({
            id: order.id,
            shippingName: order.shippingName,
            shippingPhone: order.shippingPhone,
            shippingAddress: order.shippingAddress,
            total: order.total,
            items: order.items as any,
            paymentMethod: order.paymentMethod,
          });

          await db.update(orders)
            .set({
              ckshipShipmentId: result.shipmentId,
              ckshipOrderNumber: result.orderNumber,
              awbNumber: result.awbNumber,
              courierName: result.courierName,
              shippingCost: result.shippingCost !== null ? String(result.shippingCost) : null,
              labelUrl: result.labelUrl,
              shipmentStatus: "Created",
              trackingStatus: "Packed",
              trackingUpdatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

          /* Send shipment SMS notification */
          if (order.shippingPhone && result.awbNumber && result.courierName) {
            sendSMS(
              order.shippingPhone,
              smsShipmentCreated(order.shippingName ?? "Customer", result.awbNumber, result.courierName, order.trackingId)
            ).catch(console.error);
          }

          return Response.json({ ok: true, result });
        } catch (err: any) {
          console.error("[admin/shipments POST] CKShip error:", err);
          return Response.json({ error: err.message || "CKShip error" }, { status: 502 });
        }
      },

      PATCH: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const url = new URL(request.url);
        const action = url.searchParams.get("action");
        const orderId = url.searchParams.get("order_id");

        if (!orderId) return Response.json({ error: "Missing order_id" }, { status: 400 });

        /* refresh-all: bulk update tracking for all active shipments */
        if (action === "refresh-all") {
          const allOrders = await db
            .select({ id: orders.id, awbNumber: orders.awbNumber })
            .from(orders)
            .where(ne(orders.shipmentStatus, "Cancelled"));

          let refreshed = 0;
          const errors: string[] = [];

          for (const o of allOrders) {
            if (!o.awbNumber) continue;
            try {
              const track = await trackCKShipShipment(o.awbNumber);
              await db.update(orders)
                .set({
                  trackingStatus: track.status,
                  trackingLocation: track.location,
                  trackingEta: track.eta,
                  courierName: track.courierName ?? undefined,
                  trackingEvents: track.events,
                  shipmentStatus: "Tracking Updated",
                  trackingUpdatedAt: new Date(),
                })
                .where(eq(orders.id, o.id));
              refreshed++;
            } catch (err: any) {
              errors.push(`${o.id}: ${err?.message ?? "unknown"}`);
            }
          }

          return Response.json({ ok: true, refreshed, errors });
        }

        const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
        if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

        if (action === "refresh") {
          if (!order.awbNumber) return Response.json({ error: "No AWB number for this order" }, { status: 400 });
          try {
            const track = await trackCKShipShipment(order.awbNumber);
            await db.update(orders)
              .set({
                trackingStatus: track.status,
                trackingLocation: track.location,
                trackingEta: track.eta,
                courierName: track.courierName ?? order.courierName,
                trackingEvents: track.events,
                shipmentStatus: "Tracking Updated",
                trackingUpdatedAt: new Date(),
              })
              .where(eq(orders.id, orderId));
            return Response.json({ ok: true, track });
          } catch (err: any) {
            const msg: string = err?.message ?? "";
            /* AWB not yet active in courier system — non-fatal, just inform */
            if (msg.toLowerCase().includes("not yet available") || msg.includes("404")) {
              return Response.json({ ok: true, pending: true, message: "Tracking not yet active — check again in a few minutes" });
            }
            return Response.json({ error: msg || "Tracking refresh failed" }, { status: 502 });
          }
        }

        if (action === "refresh-label") {
          if (!order.awbNumber) return Response.json({ error: "No AWB number" }, { status: 400 });
          try {
            const labelUrl = await getCKShipLabel(order.awbNumber);
            if (labelUrl) {
              await db.update(orders).set({ labelUrl }).where(eq(orders.id, orderId));
            }
            return Response.json({ ok: true, labelUrl });
          } catch (err: any) {
            return Response.json({ error: err.message }, { status: 502 });
          }
        }

        if (action === "cancel") {
          if (!order.awbNumber) return Response.json({ error: "No AWB number" }, { status: 400 });
          try {
            const result = await cancelCKShipShipment(order.awbNumber);
            if (result.success) {
              await db.update(orders)
                .set({ shipmentStatus: "Cancelled", trackingStatus: "Cancelled", trackingUpdatedAt: new Date() })
                .where(eq(orders.id, orderId));
            }
            return Response.json(result);
          } catch (err: any) {
            return Response.json({ error: err.message }, { status: 502 });
          }
        }

        if (action === "recreate") {
          try {
            const result = await createCKShipShipment({
              id: order.id,
              shippingName: order.shippingName,
              shippingPhone: order.shippingPhone,
              shippingAddress: order.shippingAddress,
              total: order.total,
              items: order.items as any,
              paymentMethod: order.paymentMethod,
            });
            await db.update(orders)
              .set({
                ckshipShipmentId: result.shipmentId,
                ckshipOrderNumber: result.orderNumber,
                awbNumber: result.awbNumber,
                courierName: result.courierName,
                shippingCost: result.shippingCost !== null ? String(result.shippingCost) : null,
                labelUrl: result.labelUrl,
                shipmentStatus: "Recreated",
                trackingStatus: "Packed",
                trackingUpdatedAt: new Date(),
              })
              .where(eq(orders.id, orderId));

            if (order.shippingPhone && result.awbNumber && result.courierName) {
              sendSMS(
                order.shippingPhone,
                smsShipmentCreated(order.shippingName ?? "Customer", result.awbNumber, result.courierName, order.trackingId)
              ).catch(console.error);
            }

            return Response.json({ ok: true, result });
          } catch (err: any) {
            return Response.json({ error: err.message }, { status: 502 });
          }
        }

        if (action === "repush-as-cod") {
          if (order.paymentMethod?.toLowerCase() !== "cod") {
            return Response.json({ error: "Order is not a COD order" }, { status: 400 });
          }
          try {
            // Cancel existing CKShip shipment first (best-effort — don't fail if cancel errors)
            if (order.awbNumber) {
              try {
                await cancelCKShipShipment(order.awbNumber);
                console.log(`[admin/shipments] Cancelled existing AWB ${order.awbNumber} before COD re-push`);
              } catch (cancelErr) {
                console.warn(`[admin/shipments] Cancel AWB ${order.awbNumber} failed (proceeding anyway):`, cancelErr);
              }
            }

            // Re-create with payment_method: "COD" explicitly
            const result = await createCKShipShipment({
              id: order.id,
              shippingName: order.shippingName,
              shippingPhone: order.shippingPhone,
              shippingAddress: order.shippingAddress,
              total: order.total,
              items: order.items as any,
              paymentMethod: "cod",
            });

            await db.update(orders)
              .set({
                ckshipShipmentId: result.shipmentId,
                ckshipOrderNumber: result.orderNumber,
                awbNumber: result.awbNumber,
                courierName: result.courierName,
                shippingCost: result.shippingCost !== null ? String(result.shippingCost) : null,
                labelUrl: result.labelUrl,
                shipmentStatus: "Recreated (COD)",
                trackingStatus: "Packed",
                trackingUpdatedAt: new Date(),
              })
              .where(eq(orders.id, orderId));

            if (order.shippingPhone && result.awbNumber && result.courierName) {
              sendSMS(
                order.shippingPhone,
                smsShipmentCreated(order.shippingName ?? "Customer", result.awbNumber, result.courierName, order.trackingId)
              ).catch(console.error);
            }

            return Response.json({ ok: true, result });
          } catch (err: any) {
            return Response.json({ error: err.message || "Re-push as COD failed" }, { status: 502 });
          }
        }

        if (action === "update-awb") {
          let body: any;
          try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
          const newAwb = (body?.awb_number ?? "").toString().trim();
          if (!newAwb) return Response.json({ error: "awb_number is required" }, { status: 400 });

          await db.update(orders)
            .set({
              awbNumber: newAwb,
              shipmentStatus: "Created",
              trackingStatus: order.trackingStatus === "Order Placed" ? "Packed" : order.trackingStatus,
              trackingUpdatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

          return Response.json({ ok: true, awbNumber: newAwb });
        }

        return Response.json({ error: "Unknown action" }, { status: 400 });
      },
    },
  },
});
