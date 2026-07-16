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


function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

let _orderCounter = 1;
function generateOrderNumber(orderId: string): string {
  // Short readable order number: last 8 chars of UUID + counter
  const suffix = orderId.replace(/-/g, "").slice(-8).toUpperCase();
  return `SH-${suffix}-${String(_orderCounter++).padStart(3, "0")}`;
}

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

    // Parse address — extract pincode, city, state from comma-separated address string
    const address = order.shippingAddress ?? "";
    const pinMatch = address.match(/\b(\d{6})\b/);
    const pincode = pinMatch?.[1] ?? "400001";

    const cleanAddress = address
      .replace(/,?\s*\b\d{6}\b\s*,?/g, ",")
      .replace(/,\s*,/g, ",")
      .replace(/^,|,$/g, "")
      .trim();
    const parts = cleanAddress.split(",").map((p) => p.trim()).filter(Boolean);

    const stateName = parts.length >= 1 ? parts[parts.length - 1] : "Maharashtra";
    const city = parts.length >= 2 ? parts[parts.length - 2] : "Mumbai";
    const streetAddress = parts.slice(0, Math.max(1, parts.length - 2)).join(", ") || address;

    // Weight in grams: ~200g per item for herbal products, min 100g
    const weightGrams = Math.max(100, totalQty * 200);

    const isCod = order.paymentMethod?.toLowerCase() === "cod";
    const orderTotal = Number(order.total);
    const orderNumber = generateOrderNumber(order.id);

    // Use /api/shipment/add-update — the only confirmed-working CKShip endpoint.
    // (/api/shipment/create returns 404 — that Laravel route does not exist)
    //
    // CRITICAL: parcel_type 0 = COD, 1 = Prepaid (previous code had this INVERTED)
    // address_id: 195 for all shipment types (confirmed pickup address for this account)
    const payload: Record<string, unknown> = {
      address_id: 195,
      receiver_name: order.shippingName ?? "Customer",
      receiver_number: order.shippingPhone ?? "",
      receiver_address: streetAddress,
      receiver_pin: pincode,
      receiver_city: city,
      receiver_state_id: stateName,
      shipment_weight: weightGrams,
      shipment_weight_unit: "g",
      shipment_length: 5,
      shipment_length_unit: "cm",
      shipment_breadth: 5,
      shipment_breadth_unit: "cm",
      shipment_height: 5,
      shipment_height_unit: "cm",
      parcel_content_description: productDesc,
      // parcel_type: 1 = Prepaid, 0 = COD (confirmed from working payload)
      parcel_type: isCod ? 0 : 1,
      qty: totalQty,
      invoice_amount: orderTotal,
      order_id: orderNumber,
      // CKShip API requires collectable_amount for all orders (confirmed via 422 errors).
      // Prepaid = "0", COD = actual order total
      collectable_amount: isCod ? String(orderTotal) : "0",
    };

    console.log(
      `[CKShip] createShipment (${isCod ? "COD" : "Prepaid"}) for order ${order.id}:`,
      JSON.stringify({
        order_id: orderNumber,
        isCod,
        parcel_type: payload.parcel_type,
        payment_mode: payload.payment_mode,
        invoice_amount: payload.invoice_amount,
        collectable_amount: isCod ? orderTotal : "(not sent)",
        receiver_city: payload.receiver_city,
        receiver_state_id: payload.receiver_state_id,
        state_name: stateName,
        shipment_weight: payload.shipment_weight,
        shipment_weight_unit: payload.shipment_weight_unit,
      }, null, 2)
    );

    const res = await fetch(`${CKSHIP_BASE}/api/shipment/add-update`, {
      method: "POST",
      headers: ckHeaders(),
      body: JSON.stringify(payload),
    });

    const bodyText = await res.text();
    console.log("[CKShip] createShipment response:", res.status, bodyText.slice(0, 600));

    let data: any;
    try { data = JSON.parse(bodyText); } catch { throw new Error(`CKShip: Invalid response (${res.status}): ${bodyText.slice(0, 200)}`); }

    if (!res.ok) {
      throw new Error(data?.message || data?.error || data?.msg || `CKShip error ${res.status}`);
    }

    // /api/shipment/add-update response: { status: true/false, message, awb, shipment, ... }
    if (data?.status === false) {
      throw new Error(data?.message || `CKShip error ${res.status}`);
    }
    const d = data?.data ?? data;
    const awbNumber = d?.awb ?? d?.awb_number ?? d?.tracking_number ?? null;
    const shipmentId = String(d?.shipment ?? d?.shipment_id ?? d?.id ?? orderNumber);
    const courierName = d?.courier_name ?? d?.courier ?? null;
    const shippingCost = d?.shipping_cost ?? d?.rate ?? null;
    const labelUrl = d?.label_url ?? d?.label ?? null;

    return {
      shipmentId: shipmentId || null,
      orderNumber,
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
    const form = new FormData();
    form.append("tracking_id", awbNumber);
    const res = await fetch(`${CKSHIP_BASE}/api/cancel-shipment`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}`, Accept: "application/json" },
      body: form,
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
