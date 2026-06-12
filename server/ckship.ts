const CKSHIP_BASE = "https://www.ckship.in";

function token(): string {
  const t = process.env.CKSHIP_AUTH_TOKEN;
  if (!t) throw new Error("CKSHIP_AUTH_TOKEN not configured");
  return t;
}

function ckHeaders() {
  return {
    Authorization: `Bearer ${token()}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/* Retry wrapper — 3 attempts with exponential backoff (500ms, 1s, 2s) */
async function withRetry<T>(fn: () => Promise<T>, label: string, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        const delay = 500 * Math.pow(2, i);
        console.warn(`[CKShip] ${label} attempt ${i + 1} failed, retrying in ${delay}ms:`, err);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  console.error(`[CKShip] ${label} failed after ${attempts} attempts:`, lastErr);
  throw lastErr;
}

export type CKShipShipmentResult = {
  shipmentId: string | null;
  orderNumber: string;
  awbNumber: string | null;
  courierName: string | null;
  shippingCost: number | null;
  labelUrl: string | null;
  raw: unknown;
};

export type CKShipTrackResult = {
  status: string;
  location: string | null;
  eta: string | null;
  courierName: string | null;
  events: Array<{ status: string; location: string; timestamp: string; description?: string }>;
  raw: unknown;
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function generateOrderNumber(orderId: string) {
  const suffix = orderId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `SH-${suffix}`;
}

export async function createCKShipShipment(order: {
  id: string;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  total: string | number;
  items: Array<{ name: string; qty: number; price: number }>;
}): Promise<CKShipShipmentResult> {
  return withRetry(async () => {
    const orderNumber = generateOrderNumber(order.id);
    const productDesc = (order.items ?? []).map((i) => `${i.name} x${i.qty}`).join(", ").slice(0, 200) || "Herbal Products";
    const totalQty = (order.items ?? []).reduce((s, i) => s + i.qty, 0) || 1;

    const address = order.shippingAddress ?? "";
    const parts = address.split(",").map((p) => p.trim());
    const pinMatch = address.match(/\b(\d{6})\b/);
    const pincode = pinMatch?.[1] ?? "400001";
    const city = parts.length >= 2 ? parts[parts.length - 2] : "Mumbai";
    const state = parts.length >= 1 ? parts[parts.length - 1].replace(/\s*\d{6}\s*/, "").trim() : "Maharashtra";
    const streetAddress = parts.slice(0, Math.max(1, parts.length - 2)).join(", ") || address;

    const payload = {
      order_number: orderNumber,
      order_date: todayDate(),
      payment_mode: "prepaid",
      order_amount: Number(order.total),
      consignee_name: order.shippingName ?? "Customer",
      consignee_phone: order.shippingPhone ?? "",
      consignee_address: streetAddress,
      consignee_city: city,
      consignee_state: state,
      consignee_pincode: pincode,
      product_desc: productDesc,
      product_quantity: totalQty,
      product_weight: Math.max(0.1, totalQty * 0.2),
    };

    console.log("[CKShip] createShipment payload:", JSON.stringify(payload));

    const res = await fetch(`${CKSHIP_BASE}/api/shipment/create`, {
      method: "POST",
      headers: ckHeaders(),
      body: JSON.stringify(payload),
    });

    const bodyText = await res.text();
    console.log("[CKShip] createShipment response:", res.status, bodyText.slice(0, 500));

    let data: any;
    try { data = JSON.parse(bodyText); } catch { throw new Error(`CKShip: Invalid response (${res.status}): ${bodyText.slice(0, 200)}`); }

    if (!res.ok) {
      throw new Error(data?.message || data?.error || data?.msg || `CKShip error ${res.status}`);
    }

    const d = data?.data ?? data ?? {};
    const awbNumber = d.awb_number ?? d.awb ?? d.tracking_number ?? d.trackingNumber ?? null;
    const shipmentId = d.shipment_id ?? d.id ?? d.ckship_id ?? null;
    const courierName = d.courier_name ?? d.courier ?? d.service_name ?? null;
    const shippingCost = d.shipping_cost ?? d.rate ?? d.charges ?? null;
    const labelUrl = d.label_url ?? d.label ?? d.pdf_url ?? null;

    return { shipmentId, orderNumber, awbNumber, courierName, shippingCost: shippingCost ? Number(shippingCost) : null, labelUrl, raw: data };
  }, "createShipment");
}

export async function trackCKShipShipment(awbNumber: string): Promise<CKShipTrackResult> {
  return withRetry(async () => {
    const res = await fetch(`${CKSHIP_BASE}/api/shipment/track?awb=${encodeURIComponent(awbNumber)}`, {
      headers: ckHeaders(),
    });

    const bodyText = await res.text();
    console.log("[CKShip] track response:", res.status, bodyText.slice(0, 500));

    let data: any;
    try { data = JSON.parse(bodyText); } catch { throw new Error(`CKShip tracking: Invalid response`); }

    if (!res.ok) throw new Error(data?.message || data?.error || `CKShip track error ${res.status}`);

    const d = data?.data ?? data ?? {};
    const events: Array<{ status: string; location: string; timestamp: string; description?: string }> =
      (d.tracking_events ?? d.events ?? []).map((e: any) => ({
        status: e.status ?? e.activity ?? "",
        location: e.location ?? e.city ?? "",
        timestamp: e.timestamp ?? e.date ?? "",
        description: e.description ?? e.remark ?? undefined,
      }));

    const latest = events[0];
    const rawStatus: string = d.current_status ?? d.status ?? latest?.status ?? "In Transit";
    const status = mapCKShipStatus(rawStatus);

    return {
      status,
      location: d.current_location ?? d.location ?? latest?.location ?? null,
      eta: d.expected_delivery ?? d.eta ?? null,
      courierName: d.courier_name ?? d.courier ?? null,
      events,
      raw: data,
    };
  }, `trackShipment(${awbNumber})`);
}

export async function getCKShipLabel(awbNumber: string): Promise<string | null> {
  return withRetry(async () => {
    const res = await fetch(`${CKSHIP_BASE}/api/shipment/label?awb=${encodeURIComponent(awbNumber)}`, {
      headers: ckHeaders(),
    });

    const bodyText = await res.text();
    let data: any;
    try { data = JSON.parse(bodyText); } catch { return null; }

    return data?.data?.label_url ?? data?.label_url ?? data?.label ?? data?.pdf_url ?? null;
  }, `getLabel(${awbNumber})`);
}

export async function cancelCKShipShipment(awbNumber: string): Promise<{ success: boolean; message: string }> {
  return withRetry(async () => {
    const res = await fetch(`${CKSHIP_BASE}/api/shipment/cancel`, {
      method: "POST",
      headers: ckHeaders(),
      body: JSON.stringify({ awb: awbNumber }),
    });

    const bodyText = await res.text();
    console.log("[CKShip] cancel response:", res.status, bodyText.slice(0, 500));

    let data: any;
    try { data = JSON.parse(bodyText); } catch { return { success: false, message: `CKShip error: ${bodyText.slice(0, 100)}` }; }

    if (!res.ok) return { success: false, message: data?.message || data?.error || `CKShip cancel error ${res.status}` };
    return { success: true, message: data?.message ?? "Shipment cancelled" };
  }, `cancelShipment(${awbNumber})`);
}

export function mapCKShipStatus(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes("deliver") && s.includes("out")) return "Out for Delivery";
  if (s.includes("deliver")) return "Delivered";
  if (s.includes("rto")) return "RTO";
  if (s.includes("transit") || s.includes("in-transit")) return "In Transit";
  if (s.includes("ship") || s.includes("dispatch")) return "Shipped";
  if (s.includes("pack")) return "Packed";
  if (s.includes("cancel")) return "Cancelled";
  if (s.includes("return")) return "Returned";
  return raw;
}
