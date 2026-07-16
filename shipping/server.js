import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3001;

const CKSHIP_BASE = "https://www.ckship.in";
const CKSHIP_TOKEN = process.env.CKSHIP_AUTH_TOKEN;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let orderCounter = 1;
function generateOrderNumber() {
  const ts = Date.now().toString().slice(-6);
  const num = String(orderCounter++).padStart(3, "0");
  return `ORD-${ts}-${num}`;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

app.post("/place-order", async (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      address,
      city,
      state,
      pincode,
      product_name,
      quantity,
      weight,
      length: pkg_length,
      width: pkg_width,
      height: pkg_height,
      payment_mode,
      order_amount,
    } = req.body;

    // Validation
    const missing = [];
    if (!customer_name?.trim()) missing.push("Customer name");
    if (!customer_phone?.trim()) missing.push("Phone");
    if (!address?.trim()) missing.push("Address");
    if (!city?.trim()) missing.push("City");
    if (!state?.trim()) missing.push("State");
    if (!pincode?.trim()) missing.push("Pincode");
    if (!product_name?.trim()) missing.push("Product name");
    if (!quantity || isNaN(Number(quantity))) missing.push("Quantity (must be a number)");
    if (!weight || isNaN(Number(weight))) missing.push("Weight (must be a number)");
    if (!pkg_length || isNaN(Number(pkg_length))) missing.push("Length (must be a number)");
    if (!pkg_width  || isNaN(Number(pkg_width)))  missing.push("Width (must be a number)");
    if (!pkg_height || isNaN(Number(pkg_height))) missing.push("Height (must be a number)");
    if (!payment_mode) missing.push("Payment mode");
    if (!order_amount || isNaN(Number(order_amount))) missing.push("Order amount (must be a number)");

    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
    }

    if (!CKSHIP_TOKEN) {
      return res.status(500).json({ error: "CKShip API token not configured on server." });
    }

    const isCod = payment_mode.toLowerCase() === "cod";
    const weightGrams = Number(weight);
    const lengthCm = Number(pkg_length);
    const widthCm  = Number(pkg_width);
    const heightCm = Number(pkg_height);
    const orderAmt = Number(order_amount);
    const qty = Number(quantity);
    const orderNumber = generateOrderNumber();

    // address_id: 195 for all shipment types (confirmed pickup address for this account)
    const shipmentPayload = {
      address_id: 195,
      receiver_name: customer_name.trim(),
      receiver_number: customer_phone.trim(),
      receiver_address: address.trim(),
      receiver_pin: pincode.trim(),
      receiver_city: city.trim(),
      receiver_state_id: state.trim(),
      shipment_weight: weightGrams,
      shipment_weight_unit: "g",
      shipment_length: lengthCm,
      shipment_length_unit: "cm",
      shipment_breadth: widthCm,
      shipment_breadth_unit: "cm",
      shipment_height: heightCm,
      shipment_height_unit: "cm",
      parcel_content_description: product_name.trim(),
      // parcel_type: 1 = Prepaid, 0 = COD
      parcel_type: isCod ? 0 : 1,
      qty,
      invoice_amount: orderAmt,
      order_id: orderNumber,
      // CKShip API requires collectable_amount for all orders (confirmed via 422 errors).
      // Prepaid = "0", COD = actual order total
      collectable_amount: isCod ? String(orderAmt) : "0",
    };

    console.log("[CKShip] Placing shipment:", orderNumber, "| product:", product_name.trim(), "| qty:", qty, "| amount:", orderAmt, "| type:", isCod ? "COD" : "Prepaid");

    const ckRes = await fetch(`${CKSHIP_BASE}/api/shipment/add-update`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CKSHIP_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(shipmentPayload),
    });

    const ckBody = await ckRes.text();
    console.log("[CKShip] Response status:", ckRes.status);

    let ckData;
    try {
      ckData = JSON.parse(ckBody);
    } catch {
      return res.status(502).json({ error: "Invalid response from CKShip API", raw: ckBody });
    }

    if (!ckRes.ok) {
      const msg =
        ckData?.message || ckData?.error || ckData?.msg || `CKShip error (${ckRes.status})`;
      return res.status(502).json({ error: msg, details: ckData });
    }

    const d = ckData?.data ?? ckData;
    const awb =
      d?.awb ??
      d?.awb_number ??
      d?.tracking_number ??
      null;

    return res.json({
      success: true,
      awb,
      order_number: orderNumber,
      shipment_id: d?.shipment ?? d?.shipment_id ?? d?.id ?? null,
      courier: d?.courier_name ?? d?.courier ?? null,
      raw: ckData,
    });
  } catch (err) {
    console.error("[place-order] Unexpected error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

// ── Tracking proxy ──────────────────────────────────────────────────
app.get("/track-shipment", async (req, res) => {
  const awb = (req.query.awb ?? "").toString().trim();
  if (!awb) return res.status(400).json({ error: "awb is required" });
  if (!CKSHIP_TOKEN) return res.status(500).json({ error: "CKShip token not configured" });

  try {
    const ckRes = await fetch(`${CKSHIP_BASE}/api/shipment/track?awb=${encodeURIComponent(awb)}`, {
      headers: {
        Authorization: `Bearer ${CKSHIP_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const body = await ckRes.text();
    let data;
    try { data = JSON.parse(body); } catch { data = { raw: body }; }

    if (!ckRes.ok) {
      return res.status(ckRes.status).json({ error: `CKShip ${ckRes.status}`, details: data });
    }

    // Normalise response — CKShip may nest data under .data
    const d = data?.data ?? data ?? {};
    const events = (d.tracking_events ?? d.events ?? d.tracking ?? []).map(e => ({
      status: e.status ?? e.activity ?? e.remark ?? "",
      location: e.location ?? e.city ?? "",
      timestamp: e.timestamp ?? e.date ?? e.updated_at ?? "",
      description: e.description ?? e.remark ?? "",
    }));
    const latest = events[0];
    const rawStatus = d.current_status ?? d.status ?? d.shipment_status ?? latest?.status ?? null;

    return res.json({
      awb,
      status: rawStatus,
      location: d.current_location ?? d.location ?? latest?.location ?? null,
      eta: d.expected_delivery ?? d.eta ?? null,
      courier: d.courier_name ?? d.courier ?? null,
      events,
      raw: data,
    });
  } catch (err) {
    console.error("[track-shipment] Error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

app.get(/(.*)/, (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`CKShip shipping panel running at http://0.0.0.0:${PORT}`);
});
