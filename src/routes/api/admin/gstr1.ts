import { createFileRoute } from "@tanstack/react-router";
import { db } from "@server/db";
import { orders } from "@shared/schema";
import { gte, lte, and, eq } from "drizzle-orm";
import { requireAdmin } from "@server/admin-auth";

const SELLER_STATE = "rajasthan";
const GST_RATE = 0.05;

function extractState(address: string | null): string {
  if (!address) return "";
  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    if (/^\d{6}$/.test(last)) return parts[parts.length - 2] || "";
    return last;
  }
  return parts[0] || "";
}

export const Route = createFileRoute("/api/admin/gstr1")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = await requireAdmin(request);
        if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const url = new URL(request.url);
        const from = url.searchParams.get("from");
        const to = url.searchParams.get("to");
        const month = url.searchParams.get("month");
        const fy = url.searchParams.get("fy");

        const conditions: ReturnType<typeof eq>[] = [eq(orders.paymentStatus, "paid")];

        if (month) {
          const [y, m] = month.split("-").map(Number);
          const start = new Date(y, m - 1, 1);
          const end = new Date(y, m, 0, 23, 59, 59, 999);
          conditions.push(gte(orders.createdAt, start) as never);
          conditions.push(lte(orders.createdAt, end) as never);
        } else if (fy) {
          const fyYear = parseInt(fy.split("-")[0], 10);
          const start = new Date(fyYear, 3, 1);
          const end = new Date(fyYear + 1, 2, 31, 23, 59, 59, 999);
          conditions.push(gte(orders.createdAt, start) as never);
          conditions.push(lte(orders.createdAt, end) as never);
        } else {
          if (from) conditions.push(gte(orders.createdAt, new Date(from)) as never);
          if (to) {
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999);
            conditions.push(lte(orders.createdAt, toDate) as never);
          }
        }

        const rows = await db
          .select()
          .from(orders)
          .where(and(...conditions))
          .orderBy(orders.createdAt);

        const gstrRows = rows.map((o) => {
          const subtotal = Number(o.subtotal || 0);
          const taxableValue = Math.round(subtotal * 100) / 100;
          const customerState = extractState(o.shippingAddress);
          const isIntra = customerState.toLowerCase() === SELLER_STATE;
          const cgst = isIntra ? Math.round(taxableValue * 0.025 * 100) / 100 : 0;
          const sgst = isIntra ? Math.round(taxableValue * 0.025 * 100) / 100 : 0;
          const igst = isIntra ? 0 : Math.round(taxableValue * GST_RATE * 100) / 100;
          const totalGst = Math.round((cgst + sgst + igst) * 100) / 100;

          return {
            invoiceNo: `INV-${String(o.id).slice(0, 8).toUpperCase()}`,
            invoiceDate: o.createdAt,
            orderId: o.id,
            customerName: o.shippingName || "—",
            gstin: null as string | null,
            state: customerState || "Unknown",
            placeOfSupply: customerState || "Unknown",
            taxableValue,
            gstRate: 5,
            cgst,
            sgst,
            igst,
            totalGst,
            invoiceTotal: Math.round(Number(o.total || 0) * 100) / 100,
            paymentMode: o.paymentMethod || "razorpay",
            orderStatus: o.status,
          };
        });

        const totals = gstrRows.reduce(
          (acc, r) => ({
            taxableValue: acc.taxableValue + r.taxableValue,
            cgst: acc.cgst + r.cgst,
            sgst: acc.sgst + r.sgst,
            igst: acc.igst + r.igst,
            totalGst: acc.totalGst + r.totalGst,
            invoiceTotal: acc.invoiceTotal + r.invoiceTotal,
          }),
          { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalGst: 0, invoiceTotal: 0 },
        );

        Object.keys(totals).forEach((k) => {
          (totals as Record<string, number>)[k] =
            Math.round((totals as Record<string, number>)[k] * 100) / 100;
        });

        return Response.json({ rows: gstrRows, totals });
      },
    },
  },
});
