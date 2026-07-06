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

// CKShip numeric state IDs (alphabetical order, matching CKShip's state list)
const CKSHIP_STATE_IDS: Record<string, number> = {
  "andhra pradesh": 1,
  "arunachal pradesh": 2,
  "assam": 3,
  "bihar": 4,
  "chhattisgarh": 5,
  "goa": 6,
  "gujarat": 7,
  "haryana": 8,
  "himachal pradesh": 9,
  "jharkhand": 10,
  "karnataka": 11,
  "kerala": 12,
  "madhya pradesh": 13,
  "maharashtra": 14,
  "manipur": 15,
  "meghalaya": 16,
  "mizoram": 17,
  "nagaland": 18,
  "odisha": 19,
  "punjab": 20,
  "rajasthan": 21,
  "sikkim": 22,
  "tamil nadu": 23,
  "telangana": 24,
  "tripura": 25,
  "uttar pradesh": 26,
  "uttarakhand": 27,
  "west bengal": 28,
  "andaman and nicobar islands": 29,
  "chandigarh": 30,
  "dadra and nagar haveli and daman and diu": 31,
  "delhi": 32,
  "jammu and kashmir": 33,
  "ladakh": 34,
  "lakshadweep": 35,
  "puducherry": 36,
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

    // Use /api/shipment/create — same endpoint as the shipping panel (known working).
    // Field names: payment_method + cod_amount + consignee_* (NOT payment_mode / collectable_amount / receiver_*)
    const payload: Record<string, unknown> = {
      order_number: orderNumber,
      order_date: todayDate(),
      // "COD" or "prepaid" — must be exact case as CKShip expects
      payment_method: isCod ? "COD" : "prepaid",
      order_amount: orderTotal,
      consignee_name: order.shippingName ?? "Customer",
      consignee_phone: order.shippingPhone ?? "",
      consignee_address: streetAddress,
      consignee_city: city,
      consignee_state: stateName,
      consignee_pincode: pincode,
      product_desc: productDesc,
      product_quantity: totalQty,
      product_weight: weightGrams,
    };

    // cod_amount only sent for COD orders — this is what triggers COD mode in CKShip
    if (isCod) {
      payload.cod_amount = orderTotal;
    }

    console.log(
      `[CKShip] createShipment (${isCod ? "COD" : "Prepaid"}) for order ${order.id}:`,
      JSON.stringify({
        order_number: orderNumber,
        isCod,
        payment_method: payload.payment_method,
        order_amount: payload.order_amount,
        cod_amount: isCod ? orderTotal : "(not sent)",
        consignee_city: payload.consignee_city,
        consignee_state: payload.consignee_state,
        consignee_pincode: payload.consignee_pincode,
        product_weight: payload.product_weight,
      }, null, 2)
    );

    const res = await fetch(`${CKSHIP_BASE}/api/shipment/create`, {
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

    // /api/shipment/create response: { data: { awb_number, ... }, message, status }
    const d = data?.data ?? data;
    const awbNumber = d?.awb_number ?? d?.awb ?? d?.tracking_number ?? null;
    const shipmentId = String(d?.shipment_id ?? d?.id ?? orderNumber);
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
