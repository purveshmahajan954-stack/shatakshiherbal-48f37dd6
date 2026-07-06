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

function resolveStateId(stateName: string): number {
  const id = CKSHIP_STATE_IDS[stateName.trim().toLowerCase()];
  if (!id) {
    console.warn(`[CKShip] Unknown state "${stateName}" — defaulting to Maharashtra (14). Add it to CKSHIP_STATE_IDS.`);
    return 14;
  }
  return id;
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

    const stateName = parts.length >= 1 ? parts[parts.length - 1] : "Maharashtra";
    const city = parts.length >= 2 ? parts[parts.length - 2] : "Mumbai";
    const streetAddress = parts.slice(0, Math.max(1, parts.length - 2)).join(", ") || address;

    // Weight in grams: ~200g per item for herbal products, min 100g
    const weightGrams = Math.max(100, totalQty * 200);

    const isCod = order.paymentMethod?.toLowerCase() === "cod";
    const orderTotal = Number(order.total);
    const stateId = resolveStateId(stateName);

    const payload = {
      address_id: 195,
      receiver_name: order.shippingName ?? "Customer",
      receiver_number: order.shippingPhone ?? "",
      receiver_address: streetAddress,
      receiver_pin: pincode,
      receiver_city: city,
      // FIX: receiver_state_id expects a numeric ID, not a state name string
      receiver_state_id: stateId,
      // FIX: shipment_weight_unit must be the unit string "gm", not the weight value
      shipment_weight: weightGrams,
      shipment_weight_unit: "gm",
      shipment_length: 5,
      shipment_length_unit: "cm",
      shipment_breadth: 5,
      shipment_breadth_unit: "cm",
      shipment_height: 5,
      shipment_height_unit: "cm",
      parcel_content_description: productDesc,
      // parcel_type: 1 = COD, 0 = Prepaid
      parcel_type: isCod ? 1 : 0,
      qty: totalQty,
      invoice_amount: orderTotal,
      order_id: order.id,
      // CKShip uses payment_mode (NOT payment_method) — wrong field name was causing COD→Prepaid
      payment_mode: isCod ? "COD" : "Prepaid",
      // FIX: collectable_amount must be a number (not a string) — CKShip rejects string type
      ...(isCod ? { collectable_amount: orderTotal } : {}),
    };

    console.log(
      `[CKShip] createShipment payload for order ${order.id}:`,
      JSON.stringify({
        order_id: order.id,
        isCod,
        paymentMethod: order.paymentMethod,
        parcel_type: payload.parcel_type,
        payment_mode: payload.payment_mode,
        invoice_amount: payload.invoice_amount,
        // FIX: log the actual type being sent so it matches payload
        collectable_amount: isCod ? orderTotal : "(not sent — prepaid)",
        collectable_amount_type: isCod ? typeof orderTotal : "n/a",
        receiver_pin: payload.receiver_pin,
        receiver_city: payload.receiver_city,
        receiver_state_id: payload.receiver_state_id,
        state_name_parsed: stateName,
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
