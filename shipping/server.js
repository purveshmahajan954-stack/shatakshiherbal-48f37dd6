import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

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
    if (!quantity) missing.push("Quantity");
    if (!weight) missing.push("Weight");
    if (!payment_mode) missing.push("Payment mode");
    if (!order_amount) missing.push("Order amount");

    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
    }

    if (!CKSHIP_TOKEN) {
      return res.status(500).json({ error: "CKShip API token not configured on server." });
    }

    const shipmentPayload = {
      order_number: generateOrderNumber(),
      order_date: todayDate(),
      payment_mode: payment_mode.toLowerCase(),
      order_amount: Number(order_amount),
      consignee_name: customer_name.trim(),
      consignee_phone: customer_phone.trim(),
      consignee_address: address.trim(),
      consignee_city: city.trim(),
      consignee_state: state.trim(),
      consignee_pincode: pincode.trim(),
      product_desc: product_name.trim(),
      product_quantity: Number(quantity),
      product_weight: Number(weight),
    };

    console.log("[CKShip] Sending shipment payload:", JSON.stringify(shipmentPayload, null, 2));

    const ckRes = await fetch(`${CKSHIP_BASE}/api/shipment/create`, {
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
    console.log("[CKShip] Response body:", ckBody);

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

    const awb =
      ckData?.data?.awb_number ||
      ckData?.awb_number ||
      ckData?.data?.awb ||
      ckData?.awb ||
      ckData?.data?.tracking_number ||
      null;

    return res.json({
      success: true,
      awb,
      order_number: shipmentPayload.order_number,
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
