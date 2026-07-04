const CKSHIP_BASE = "https://www.ckship.in";

function token(): string {
  const t = process.env.CKSHIP_TOKEN ?? process.env.CKSHIP_AUTH_TOKEN;
  if (!t) throw new Error("CKSHIP_TOKEN not configured");
  return t;
}

function ckHeaders() {
  return {
    Authorization: `Bearer ${token()}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/* Wrap an error so withRetry bails out immediately without retrying */
class NoRetryError extends Error {
  constructor(message: string) { super(message); this.name = "NoRetryError"; }
}

/* Retry wrapper — 3 attempts with exponential backoff (500ms, 1s, 2s).
   Throws NoRetryError directly without any retry. */
async function withRetry<T>(fn: () => Promise<T>, label: string, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof NoRetryError) throw err;
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

export async function createCKShipShipment(order: {
  id: string;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  total: string | number;
  items: Array<{ name: string; qty: number; price: number }>;
  paymentMethod?: string | null;
}): Promise<CKShipShipmentResult> {
  return withRetry(async () => {
    const productDesc = (order.items ?? []).map((i) => `${i.name} x${i.qty}`).join(", ").slice(0, 200) || "Herbal Products";
    const totalQty = (order.items ?? []).reduce((s, i) => s + i.qty, 0) || 1;

    // Parse address parts — remove pincode first so last part = state, second-last = city
    const address = order.shippingAddress ?? "";
    const pinMatch = address.match(/\b(\d{6})\b/);
    const pincode = pinMatch?.[1] ?? "400001";

    // Strip the 6-digit pincode (and any surrounding commas/spaces) to get clean parts
    const cleanAddress = address
      .replace(/,?\s*\b\d{6}\b\s*,?/g, ",")
      .replace(/,\s*,/g, ",")
      .replace(/^,|,$/g, "")
      .trim();
    const parts = cleanAddress.split(",").map((p) => p.trim()).filter(Boolean);

    const state = parts.length >= 1 ? parts[parts.length - 1] : "Maharashtra";
    const city = parts.length >= 2 ? parts[parts.length - 2] : "Mumbai";
    const streetAddress = parts.slice(0, Math.max(1, parts.length - 2)).join(", ") || address;

    // Weight: ~0.3 kg per item, min 0.1 kg
    const weight = Math.max(0.1, totalQty * 0.3);

    const isCod = order.paymentMethod?.toLowerCase() === "cod";

    const payload = {
      address_id: 195,
      receiver_name: order.shippingName ?? "Customer",
      receiver_number: order.shippingPhone ?? "",
      receiver_address: streetAddress,
      receiver_pin: pincode,
      receiver_city: city,
      receiver_state_id: state,
      shipment_weight: weight,
      shipment_length: 15,
      shipment_breadth: 10,
      shipment_height: 10,
      parcel_content_description: productDesc,
      parcel_type: isCod ? 1 : 0,
      qty: totalQty,
      invoice_amount: Number(order.total),
      order_id: order.id,
      payment_method: isCod ? "COD" : "prepaid",
      ...(isCod ? { cod_amount: Number(order.total) } : {}),
    };

    console.log("[CKShip] createShipment payload:", JSON.stringify(payload));

    const res = await fetch(`${CKSHIP_BASE}/api/shipment/add-update`, {
      method: "POST",
      headers: ckHeaders(),
      body: JSON.stringify(payload),
    });

    const bodyText = await res.text();
    console.log("[CKShip] createShipment response:", res.status, bodyText.slice(0, 500));

    let data: any;
    try { data = JSON.parse(bodyText); } catch { throw new Error(`CKShip: Invalid response (${res.status}): ${bodyText.slice(0, 200)}`); }

    // API returns { "status": true/false, "message": "...", "shipment": "...", "awb": "..." }
    if (data?.status === false) {
      throw new Error(data?.message || `CKShip error ${res.status}`);
    }

    if (!res.ok && data?.status !== true) {
      throw new Error(data?.message || data?.error || data?.msg || `CKShip error ${res.status}`);
    }

    const awbNumber = data?.awb ?? data?.awb_number ?? data?.data?.awb ?? null;
    const shipmentId = String(data?.shipment ?? data?.shipment_id ?? data?.data?.shipment_id ?? "");
    const courierName = data?.courier_name ?? data?.courier ?? data?.data?.courier_name ?? null;
    const shippingCost = data?.shipping_cost ?? data?.rate ?? data?.data?.shipping_cost ?? null;
    const labelUrl = data?.label_url ?? data?.label ?? data?.data?.label_url ?? null;

    return {
      shipmentId: shipmentId || null,
      orderNumber: order.id,
      awbNumber,
      courierName,
      shippingCost: shippingCost ? Number(shippingCost) : null,
      labelUrl,
      raw: data,
    };
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

    if (!res.ok) {
      const msg = data?.message || data?.error || data?.msg || `CKShip track error ${res.status}`;
      // All 4xx = AWB not yet active or invalid — don't retry, they won't recover on retry
      if (res.status >= 400 && res.status < 500) throw new NoRetryError(`Tracking not yet available (${res.status}): ${msg}`);
      throw new Error(msg);
    }

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
