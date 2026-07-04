// Shipping label generator — exact Delhivery-style layout matching the printed label.
// Uses JsBarcode via CDN (loaded inside the print window — no bundler dependency).

export type LabelData = {
  id: string;
  awbNumber: string;
  courierName?: string | null;
  shippingName?: string | null;
  shippingPhone?: string | null;
  shippingAddress?: string | null;
  total: string | number;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  items: Array<{ name: string; qty: number; price: number }>;
  createdAt: string;
  trackingId?: string | null;
};

// ── Seller / return constants ───────────────────────────────────────────────
const SELLER_NAME    = "Suneel Katiya Shatakshi Herbal";
const SELLER_ADDRESS = "Gadarwara";
const SELLER_GST     = "23CNYPK2804B1Z6";
const RETURN_ADDRESS = "Bypass Road Near Chitragupt School Shivaji Ward, PIN: 487551";
const CUSTOMER_CARE  = "9754468444";

// ── Helpers ─────────────────────────────────────────────────────────────────

function extractPincode(address: string | null | undefined): string {
  if (!address) return "";
  const m = address.match(/\b[1-9][0-9]{5}\b/);
  return m ? m[0] : "";
}

function fmtAmount(v: string | number | null | undefined): string {
  if (v == null || v === "") return "—";
  return `INR ${Number(v).toLocaleString("en-IN")}`;
}

function fmtDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return { date, time: `${h} : ${m} : ${s}` };
}

/** Bottom barcode number: YYYYMMDDHHMMSS + 3 digit suffix from order id */
function buildOrderBarcode(id: string, iso: string): string {
  const d = new Date(iso);
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const hms = `${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;
  const suffix = id.replace(/-/g, "").replace(/[^0-9]/g, "0").slice(0, 3).padStart(3, "0");
  return `${ymd}${hms}${suffix}`;
}

function paymentLabel(method: string | null | undefined, status: string | null | undefined): string {
  if (method?.toLowerCase() === "cod") return "COD";
  return "Pre-paid";
}

/** Renders the courier name — highlights the Y in Delhivery red */
function courierHtml(name: string | null | undefined): string {
  const n = (name ?? "DELHIVERY").toUpperCase().trim();
  if (n === "DELHIVERY") {
    return `DELHIVER<span style="color:#e00;font-weight:900">Y</span>`;
  }
  return n;
}

// ── HTML generator ───────────────────────────────────────────────────────────

export function getShippingLabelHtml(order: LabelData): string {
  const pincode       = extractPincode(order.shippingAddress);
  const { date, time } = fmtDate(order.createdAt);
  const orderBarcode  = buildOrderBarcode(order.id, order.createdAt);
  const payLabel      = paymentLabel(order.paymentMethod, order.paymentStatus);
  const items         = Array.isArray(order.items) ? order.items : [];
  const totalQty      = items.reduce((s, i) => s + i.qty, 0);
  const grandTotal    = Number(order.total) || 0;

  // Address lines — split on comma/newline for display
  const addressText = (order.shippingAddress ?? "").replace(/\n/g, ", ").trim();

  // Product rows
  const productRows = items.map(it => {
    const lineTotal = it.price * it.qty;
    return `<tr>
      <td class="td-name">${it.name}</td>
      <td class="td-right">${fmtAmount(lineTotal)}</td>
      <td class="td-right">${fmtAmount(lineTotal)}</td>
    </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Label — ${order.awbNumber}</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: Arial, Helvetica, sans-serif;
    background: #fff;
    color: #000;
    font-size: 10pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── Outer label box ── */
  .label {
    width: 105mm;
    border: 2pt solid #000;
    margin: 4mm auto;
    page-break-inside: avoid;
  }

  /* ── Every section gets a bottom border ── */
  .section { border-bottom: 1.5pt solid #000; }
  .section:last-child { border-bottom: none; }

  /* ── 1. Header: Seller name | Courier logo ── */
  .hdr {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3pt 5pt;
    min-height: 18pt;
  }
  .hdr-seller { font-size: 9pt; font-weight: bold; max-width: 55mm; line-height: 1.3; }
  .hdr-courier {
    font-size: 20pt;
    font-weight: 900;
    letter-spacing: -0.5pt;
    line-height: 1;
    text-align: right;
    font-style: italic;
  }

  /* ── 2. AWB barcode ── */
  .bc-wrap {
    padding: 3pt 3pt 1pt;
    text-align: center;
  }
  .bc-wrap svg { display: block; width: 100%; }
  .awb-num {
    font-size: 11pt;
    font-weight: bold;
    letter-spacing: 2pt;
    text-align: center;
    padding: 1pt 0 2pt;
    font-family: 'Courier New', monospace;
  }

  /* ── 3. Pincode / sort row ── */
  .pin-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3pt 6pt;
    font-size: 14pt;
    font-weight: bold;
  }

  /* ── 4. Ship-to + payment box ── */
  .addr-pay {
    display: flex;
    min-height: 95pt;
  }
  .ship-to {
    flex: 1;
    padding: 4pt 5pt;
    border-right: 1.5pt solid #000;
    font-size: 8pt;
    line-height: 1.5;
  }
  .ship-label {
    font-size: 8pt;
    font-weight: bold;
    letter-spacing: 0.5pt;
    margin-bottom: 2pt;
  }
  .customer-name {
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
    line-height: 1.2;
    margin-bottom: 2pt;
  }
  .pay-box {
    width: 30mm;
    padding: 5pt 4pt;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    gap: 1pt;
  }
  .pay-type  { font-size: 12pt; font-weight: bold; }
  .pay-mode  { font-size: 10pt; font-weight: bold; }
  .pay-cur   { font-size: 9pt; margin-top: 4pt; }
  .pay-amt   { font-size: 14pt; font-weight: bold; line-height: 1.2; }

  /* ── 5. Seller + date row ── */
  .seller-row {
    display: flex;
    font-size: 8pt;
    line-height: 1.55;
  }
  .seller-info {
    flex: 1;
    padding: 3pt 5pt;
    border-right: 1.5pt solid #000;
  }
  .date-info {
    padding: 3pt 5pt;
    white-space: nowrap;
    font-size: 8pt;
  }

  /* ── 6. Product table ── */
  .prod-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
  }
  .prod-table thead tr {
    border-bottom: 1pt solid #000;
  }
  .prod-table th {
    padding: 2pt 4pt;
    font-weight: bold;
    text-align: left;
    background: #f0f0f0;
    font-size: 8pt;
  }
  .prod-table th.th-right { text-align: right; }
  .prod-table td { padding: 2pt 4pt; border-bottom: 0.5pt solid #ccc; }
  .td-name  { text-align: left; }
  .td-right { text-align: right; }
  .tfoot-row td {
    font-weight: bold;
    border-top: 1pt solid #000;
    border-bottom: none;
    padding: 2.5pt 4pt;
  }

  /* ── 7. Bottom barcode ── */
  .bc-bottom {
    padding: 3pt 3pt 1pt;
    text-align: center;
  }
  .bc-bottom svg { display: block; width: 100%; }
  .bc-bottom-num {
    font-size: 8pt;
    letter-spacing: 1pt;
    text-align: center;
    padding: 1pt 0 2pt;
    font-family: 'Courier New', monospace;
  }

  /* ── 8. Footer ── */
  .footer {
    padding: 3pt 5pt;
    font-size: 8pt;
    line-height: 1.6;
  }

  /* ── Print ── */
  @media print {
    body { margin: 0; }
    .label { margin: 0; width: 100%; border: 2pt solid #000; }
    @page { size: 105mm auto; margin: 3mm; }
  }
</style>
</head>
<body>

<div class="label">

  <!-- 1. Header -->
  <div class="section hdr">
    <div class="hdr-seller">${SELLER_NAME}</div>
    <div class="hdr-courier">${courierHtml(order.courierName)}</div>
  </div>

  <!-- 2. AWB barcode -->
  <div class="section bc-wrap">
    <svg id="bc-awb"></svg>
    <div class="awb-num">${order.awbNumber}</div>
  </div>

  <!-- 3. Pincode / sort -->
  <div class="section pin-row">
    <span>${pincode || "—"}</span>
    <span style="font-size:10pt;font-weight:normal;color:#666">${order.trackingId ?? ""}</span>
  </div>

  <!-- 4. Ship-to + payment -->
  <div class="section addr-pay">
    <div class="ship-to">
      <div class="ship-label">SHIP TO:</div>
      <div class="customer-name">${order.shippingName ?? "—"}</div>
      <div>${order.shippingName ?? ""}</div>
      <div>Address: ${addressText}</div>
      ${pincode ? `<div><strong>PIN:</strong> ${pincode}</div>` : ""}
      <div><strong>Mobile:</strong> ${order.shippingPhone ?? "—"}</div>
    </div>
    <div class="pay-box">
      <div class="pay-type">${payLabel}</div>
      <div class="pay-mode">Surface</div>
      <div class="pay-cur">INR</div>
      <div class="pay-amt">${grandTotal.toLocaleString("en-IN")}</div>
    </div>
  </div>

  <!-- 5. Seller + date -->
  <div class="section seller-row">
    <div class="seller-info">
      <strong>Seller:</strong> ${SELLER_NAME}<br>
      <strong>Address:</strong> ${SELLER_ADDRESS}<br>
      <strong>GST:</strong> ${SELLER_GST}
    </div>
    <div class="date-info">
      <strong>Date:</strong> ${date}<br>
      ${time}
    </div>
  </div>

  <!-- 6. Product table -->
  <div class="section">
    <table class="prod-table">
      <thead>
        <tr>
          <th>Product(Qty)</th>
          <th class="th-right" style="width:12mm">${totalQty}</th>
          <th class="th-right" style="width:22mm">Price</th>
          <th class="th-right" style="width:22mm">Total</th>
        </tr>
      </thead>
      <tbody>${productRows}</tbody>
      <tfoot>
        <tr class="tfoot-row">
          <td colspan="2">Total</td>
          <td class="td-right">${fmtAmount(grandTotal)}</td>
          <td class="td-right">${fmtAmount(grandTotal)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- 7. Bottom barcode -->
  <div class="section bc-bottom">
    <svg id="bc-order"></svg>
    <div class="bc-bottom-num">${orderBarcode}</div>
  </div>

  <!-- 8. Footer -->
  <div class="footer">
    <strong>Return Address:</strong> ${RETURN_ADDRESS}<br>
    <strong>Customer Care:</strong> ${CUSTOMER_CARE}
  </div>

</div>

<script>
window.onload = function () {
  var opts = {
    format: "CODE128",
    displayValue: false,
    margin: 4,
    background: "#ffffff",
    lineColor: "#000000",
  };

  // AWB barcode — tall, full-width
  var awbSvg = document.getElementById("bc-awb");
  var labelW = document.querySelector(".label").offsetWidth;
  JsBarcode(awbSvg, "${order.awbNumber}", Object.assign({}, opts, {
    width: Math.max(1.4, labelW / ${order.awbNumber.length * 11}),
    height: 60,
  }));
  awbSvg.removeAttribute("width");
  awbSvg.style.width = "100%";

  // Order barcode — slightly shorter
  var ordSvg = document.getElementById("bc-order");
  JsBarcode(ordSvg, "${orderBarcode}", Object.assign({}, opts, {
    width: Math.max(1.2, labelW / ${orderBarcode.length * 11}),
    height: 45,
  }));
  ordSvg.removeAttribute("width");
  ordSvg.style.width = "100%";

  setTimeout(function () { window.print(); }, 800);
};
<\/script>
</body>
</html>`;
}

// ── Print trigger ────────────────────────────────────────────────────────────

export function printShippingLabel(order: LabelData) {
  if (!order.awbNumber) {
    alert("AWB number not available — please wait for shipment creation to complete.");
    return;
  }
  const html = getShippingLabelHtml(order);
  const blob = new Blob([html], { type: "text/html" });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, "_blank", "width=480,height=750,toolbar=0,menubar=0");
  if (!win) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `label-${order.awbNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  setTimeout(() => URL.revokeObjectURL(url), 90_000);
}
