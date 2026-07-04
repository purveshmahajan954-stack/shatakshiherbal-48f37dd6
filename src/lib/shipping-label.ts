// Shipping label generator — Delhivery-style A6 label with Code128 barcodes.
// Uses JsBarcode via CDN (loaded inside the print window, no bundler dependency).

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
const RETURN_ADDRESS = "Bypass Road Near Chitragupt School, Shivaji Ward, PIN: 487551";
const CUSTOMER_CARE  = "9754468444";

// ── Helpers ─────────────────────────────────────────────────────────────────

function extractPincode(address: string | null | undefined): string {
  if (!address) return "";
  const m = address.match(/\b[1-9][0-9]{5}\b/);
  return m ? m[0] : "";
}

function fmtAmount(v: string | number | null | undefined): string {
  if (v == null) return "—";
  return `INR ${Number(v).toLocaleString("en-IN")}`;
}

function fmtDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  return { date, time };
}

/** Build a bottom-barcode number similar to Delhivery: YYYYMMDD + HHMMSS + 3-digit suffix */
function buildOrderBarcode(id: string, iso: string): string {
  const d = new Date(iso);
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const hms = `${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;
  const suffix = id.replace(/-/g, "").replace(/\D/g, "").slice(0, 3).padStart(3, "0");
  return `${ymd}${hms}${suffix}`;
}

function paymentLabel(method: string | null | undefined, status: string | null | undefined): string {
  if (method === "cod") return "COD";
  if (status === "paid" || status === "confirmed") return "Pre-paid";
  return "Pre-paid";
}

// ── HTML generator ───────────────────────────────────────────────────────────

export function getShippingLabelHtml(order: LabelData): string {
  const pincode     = extractPincode(order.shippingAddress);
  const { date, time } = fmtDate(order.createdAt);
  const orderBarcode = buildOrderBarcode(order.id, order.createdAt);
  const payLabel    = paymentLabel(order.paymentMethod, order.paymentStatus);
  const items       = Array.isArray(order.items) ? order.items : [];
  const totalQty    = items.reduce((s, i) => s + i.qty, 0);
  const courier     = order.courierName ?? "DELHIVERY";

  const productRows = items.map(it => `
    <tr>
      <td class="td-left">${it.name} (${it.qty})</td>
      <td class="td-right">${fmtAmount(it.price * it.qty)}</td>
      <td class="td-right">${fmtAmount(it.price * it.qty)}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Shipping Label — ${order.awbNumber}</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    background: #fff;
    color: #000;
  }

  .label {
    width: 100mm;
    border: 2px solid #000;
    margin: 0 auto;
    page-break-inside: avoid;
  }

  /* ── Header ── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 6px;
    border-bottom: 2px solid #000;
    min-height: 22px;
  }
  .header-seller { font-size: 10px; font-weight: bold; max-width: 55mm; }
  .header-courier {
    font-size: 17px;
    font-weight: 900;
    letter-spacing: -0.5px;
    text-align: right;
  }
  .header-courier .courier-dot { color: #e22; }

  /* ── Barcodes ── */
  .barcode-row {
    padding: 4px 4px 2px;
    text-align: center;
    border-bottom: 1.5px solid #000;
  }
  .barcode-row svg { display: block; margin: 0 auto; }
  .barcode-num {
    font-size: 10px;
    font-weight: bold;
    letter-spacing: 1px;
    margin-top: 1px;
  }

  /* ── Pincode / route row ── */
  .pin-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3px 6px;
    border-bottom: 1.5px solid #000;
    font-size: 13px;
    font-weight: bold;
  }

  /* ── Ship-to + payment ── */
  .address-payment {
    display: flex;
    border-bottom: 1.5px solid #000;
    min-height: 38mm;
  }
  .ship-to {
    flex: 1;
    padding: 5px 6px;
    border-right: 1.5px solid #000;
    font-size: 10px;
    line-height: 1.5;
  }
  .ship-to .ship-label {
    font-size: 9px;
    font-weight: bold;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }
  .ship-to .customer-name {
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
  }
  .payment-box {
    width: 28mm;
    padding: 5px 4px;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
  }
  .payment-type { font-size: 11px; font-weight: bold; }
  .payment-mode { font-size: 10px; }
  .payment-amount-label { font-size: 9px; margin-top: 4px; }
  .payment-amount { font-size: 13px; font-weight: bold; line-height: 1.2; }

  /* ── Seller + date ── */
  .seller-row {
    display: flex;
    border-bottom: 1.5px solid #000;
    font-size: 9.5px;
    line-height: 1.55;
  }
  .seller-info { flex: 1; padding: 3px 6px; border-right: 1.5px solid #000; }
  .date-info   { padding: 3px 6px; white-space: nowrap; }

  /* ── Product table ── */
  .product-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5px;
    border-bottom: 1.5px solid #000;
  }
  .product-table th {
    background: #f0f0f0;
    border-bottom: 1px solid #000;
    padding: 2px 4px;
    font-weight: bold;
    text-align: left;
  }
  .product-table th.th-right { text-align: right; }
  .product-table td { padding: 2px 4px; border-bottom: 1px solid #ccc; }
  .td-left  { text-align: left; }
  .td-right { text-align: right; }
  .total-row td { font-weight: bold; border-top: 1px solid #000; border-bottom: none; }

  /* ── Bottom barcode ── */
  .bottom-barcode {
    padding: 4px 4px 2px;
    text-align: center;
    border-bottom: 1.5px solid #000;
  }

  /* ── Footer ── */
  .footer {
    padding: 3px 6px;
    font-size: 9px;
    line-height: 1.55;
  }

  @media print {
    body { margin: 0; }
    .label { border: 2px solid #000; margin: 0; }
    @page { size: 100mm auto; margin: 3mm; }
  }
</style>
</head>
<body>

<div class="label">

  <!-- ① Header -->
  <div class="header">
    <div class="header-seller">${SELLER_NAME}</div>
    <div class="header-courier">${courier.toUpperCase().replace("DELHIVERY", "DELHIVER<span class=courier-dot>Y</span>")}</div>
  </div>

  <!-- ② Main AWB barcode -->
  <div class="barcode-row">
    <svg id="bc-awb"></svg>
    <div class="barcode-num">${order.awbNumber}</div>
  </div>

  <!-- ③ Pincode / route -->
  <div class="pin-row">
    <span>${pincode || "—"}</span>
    <span style="font-size:11px;font-weight:normal;color:#555">▶</span>
    <span style="font-size:11px">${order.trackingId ? order.trackingId.slice(0, 7).toUpperCase() : ""}</span>
  </div>

  <!-- ④ Ship-to + payment -->
  <div class="address-payment">
    <div class="ship-to">
      <div class="ship-label">SHIP TO:</div>
      <div class="customer-name">${order.shippingName ?? "—"}</div>
      <div>${order.shippingName ?? ""}</div>
      <div style="margin-top:2px">${(order.shippingAddress ?? "").replace(/\n/g, ", ")}</div>
      ${pincode ? `<div><strong>PIN:</strong> ${pincode}</div>` : ""}
      <div><strong>Mobile:</strong> ${order.shippingPhone ?? "—"}</div>
    </div>
    <div class="payment-box">
      <div class="payment-type">${payLabel}</div>
      <div class="payment-mode">Surface</div>
      <div class="payment-amount-label">INR</div>
      <div class="payment-amount">${Number(order.total).toLocaleString("en-IN")}</div>
    </div>
  </div>

  <!-- ⑤ Seller + date -->
  <div class="seller-row">
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

  <!-- ⑥ Product table -->
  <table class="product-table">
    <thead>
      <tr>
        <th>Product(Qty)</th>
        <th class="th-right" style="width:16mm">${totalQty}</th>
        <th class="th-right" style="width:20mm">Price</th>
        <th class="th-right" style="width:20mm">Total</th>
      </tr>
    </thead>
    <tbody>
      ${productRows}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="2"><strong>Total</strong></td>
        <td class="td-right">${fmtAmount(order.total)}</td>
        <td class="td-right">${fmtAmount(order.total)}</td>
      </tr>
    </tfoot>
  </table>

  <!-- ⑦ Bottom order barcode -->
  <div class="bottom-barcode">
    <svg id="bc-order"></svg>
    <div class="barcode-num" style="font-size:9px;letter-spacing:0.5px">${orderBarcode}</div>
  </div>

  <!-- ⑧ Footer -->
  <div class="footer">
    <strong>Return Address:</strong> ${RETURN_ADDRESS}<br>
    <strong>Customer Care:</strong> ${CUSTOMER_CARE}
  </div>

</div>

<script>
  window.onload = function () {
    try {
      JsBarcode("#bc-awb", "${order.awbNumber}", {
        format: "CODE128",
        width: 1.6,
        height: 55,
        displayValue: false,
        margin: 2,
      });
      JsBarcode("#bc-order", "${orderBarcode}", {
        format: "CODE128",
        width: 1.4,
        height: 40,
        displayValue: false,
        margin: 2,
      });
    } catch (e) {
      console.error("Barcode error:", e);
    }
    setTimeout(function () { window.print(); }, 800);
  };
<\/script>
</body>
</html>`;
}

// ── Print trigger ────────────────────────────────────────────────────────────

export function printShippingLabel(order: LabelData) {
  if (!order.awbNumber) {
    alert("AWB number not available yet — please wait for shipment creation to complete.");
    return;
  }
  const html = getShippingLabelHtml(order);
  const blob = new Blob([html], { type: "text/html" });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, "_blank", "width=430,height=700,toolbar=0,menubar=0");
  if (!win) {
    // Popup blocked — fallback: download
    const a = document.createElement("a");
    a.href = url;
    a.download = `label-${order.awbNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  setTimeout(() => URL.revokeObjectURL(url), 90_000);
}
