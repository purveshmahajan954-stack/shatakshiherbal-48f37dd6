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
    const orderAmt = Number(order_amount);
    const qty = Number(quantity);
    const orderNumber = generateOrderNumber();

    // Confirmed working payload format from CKShip API
    // address_id: prepaid → 335, COD → 195
    const shipmentPayload = {
      address_id: isCod ? 195 : 335,
      receiver_name: customer_name.trim(),
      receiver_number: customer_phone.trim(),
      receiver_address: address.trim(),
      receiver_pin: pincode.trim(),
      receiver_city: city.trim(),
      receiver_state_id: state.trim(),
      shipment_weight: weightGrams,
      shipment_weight_unit: String(weightGrams),
      shipment_length: 5,
      shipment_length_unit: "cm",
      shipment_breadth: 5,
      shipment_breadth_unit: "cm",
      shipment_height: 5,
      shipment_height_unit: "cm",
      parcel_content_description: product_name.trim(),
      // parcel_type: 1 = Prepaid, 0 = COD
      parcel_type: isCod ? 0 : 1,
      qty,
      invoice_amount: orderAmt,
      order_id: orderNumber,
      // collectable_amount: only for COD, prepaid omits it entirely
      ...(isCod ? { collectable_amount: String(orderAmt) } : {}),
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

app.get(/(.*)/, (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`CKShip shipping panel running at http://0.0.0.0:${PORT}`);
});
