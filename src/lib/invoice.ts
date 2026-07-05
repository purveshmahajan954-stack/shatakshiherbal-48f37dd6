type InvoiceItem = { name: string; qty: number; price: number };

type InvoiceData = {
  id: string;
  shipping_name?: string | null;
  shipping_phone?: string | null;
  email?: string | null;
  shipping_address?: string | null;
  items: InvoiceItem[];
  subtotal: number;
  gst?: number | null;
  delivery_charge: number;
  total: number;
  payment_status: string;
  payment_method?: string | null;
  razorpay_payment_id?: string | null;
  created_at: string;
};

function generateInvoiceNumber(orderId: string, createdAt: string): string {
  const d = new Date(createdAt);
  const ymd =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  const suffix = orderId.replace(/-/g, "").slice(0, 4).toUpperCase();
  return `INV-${ymd}-${suffix}`;
}

export function getInvoiceHtml(order: InvoiceData): string {
  const items = Array.isArray(order.items) ? order.items : [];
  const date = new Date(order.created_at).toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const orderId = `#${order.id.slice(0, 8).toUpperCase()}`;
  const invoiceNumber = generateInvoiceNumber(order.id, order.created_at);

  const subtotal = Number(order.subtotal) || 0;
  const delivery = Number(order.delivery_charge) || 0;
  const grandTotal = subtotal + delivery;

  // GST back-calculation @ 5% inclusive (Ayurvedic products)
  // If gst stored in DB, use it; otherwise back-calculate
  const gstTotal = Number(order.gst) > 0
    ? Number(order.gst)
    : Math.round(subtotal * 5 / 105);
  const cgst = Math.round(gstTotal / 2);
  const sgst = gstTotal - cgst;
  const taxableValue = subtotal - gstTotal;

  const rows = items
    .map(
      (it) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;">${it.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;">${it.qty}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;">₹${Number(it.price).toLocaleString("en-IN")}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">₹${(Number(it.price) * it.qty).toLocaleString("en-IN")}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Invoice ${invoiceNumber} — Shatakshi Herbal</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#222;background:#fff;padding:40px;max-width:800px;margin:0 auto}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;border-bottom:3px solid #2D5016;padding-bottom:20px}
  .brand h1{font-size:22px;font-weight:800;color:#2D5016;letter-spacing:-0.5px}
  .brand p{font-size:11px;color:#666;margin-top:3px;line-height:1.5}
  .brand .gst-block{margin-top:8px;padding:6px 10px;background:#f0f5eb;border-radius:6px;display:inline-block}
  .brand .gst-block p{font-size:10.5px;color:#2D5016;font-weight:600;margin-top:0}
  .invoice-meta{text-align:right}
  .invoice-meta h2{font-size:24px;color:#2D5016;font-weight:700;letter-spacing:2px}
  .invoice-meta p{font-size:12px;color:#666;margin-top:4px}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px}
  .info-box{background:#f7f7f2;border-radius:8px;padding:14px 16px}
  .info-box .label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:6px;font-weight:600}
  .info-box .value{font-size:13px;color:#222;line-height:1.6}
  .section-title{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:10px;font-weight:600}
  table{width:100%;border-collapse:collapse;margin-bottom:20px}
  thead{background:#2D5016;color:#fff}
  thead th{padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;text-align:left;font-weight:600}
  thead th:nth-child(2){text-align:center}
  thead th:nth-child(3),thead th:nth-child(4){text-align:right}
  .totals{margin-left:auto;width:320px;border:1px solid #eee;border-radius:8px;overflow:hidden}
  .totals .row{display:flex;justify-content:space-between;padding:9px 14px;font-size:13px;border-bottom:1px solid #eee}
  .totals .row.sub{background:#f7f7f2}
  .totals .row.gst-row{font-size:12px;color:#555;padding:7px 14px 7px 24px;background:#fafaf7}
  .totals .row.divider{border-top:2px solid #e0e0e0;border-bottom:none;padding-top:10px}
  .totals .row:last-child{background:#2D5016;color:#fff;font-weight:700;font-size:15px;border-bottom:none;padding:12px 14px}
  .gst-note{font-size:10.5px;color:#888;margin-top:10px;text-align:right;font-style:italic}
  .footer{margin-top:40px;padding-top:20px;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center;line-height:1.6}
  @media print{body{padding:20px}@page{margin:1cm}}
</style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>🌿 SHATAKSHI HERBAL</h1>
      <p>Pure Ayurvedic · AYUSH Certified · 100% Natural</p>
      <p>Bypass Road, Near Chitragupt School, Shivaji Ward</p>
      <p>Gadarwara, Narsinghpur, Madhya Pradesh – 487551</p>
      <p>📞 9754468444 &nbsp;|&nbsp; ✉ shatakshiherbal2015@gmail.com</p>
      <div class="gst-block">
        <p>GSTIN: 23CNYPK2804B1Z6</p>
        <p>State: 23 – Madhya Pradesh</p>
      </div>
    </div>
    <div class="invoice-meta">
      <h2>TAX INVOICE</h2>
      <p><strong>Invoice No:</strong> ${invoiceNumber}</p>
      <p><strong>Order:</strong> ${orderId}</p>
      <p><strong>Date:</strong> ${date}</p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <div class="label">Billed To</div>
      <div class="value">
        <strong>${order.shipping_name || "—"}</strong><br>
        ${order.email || "—"}<br>
        ${order.shipping_phone ? `📞 ${order.shipping_phone}<br>` : ""}
        ${(order.shipping_address || "").replace(/\n/g, "<br>")}
      </div>
    </div>
    <div class="info-box">
      <div class="label">Payment Details</div>
      <div class="value">
        <strong>Method:</strong> ${order.payment_method === "cod" ? "Cash on Delivery" : (order.razorpay_payment_id || order.payment_status === "paid" || order.payment_status === "confirmed") ? "Online (Razorpay)" : "—"}<br>
        <strong>Status:</strong> <span style="color:#2D5016;font-weight:600;text-transform:capitalize">${order.payment_status}</span><br>
        ${order.razorpay_payment_id ? `<strong>Payment ID:</strong><br><span style="font-size:11px;font-family:monospace">${order.razorpay_payment_id}</span>` : ""}
      </div>
    </div>
  </div>

  <div>
    <div class="section-title">Order Items (Prices inclusive of GST)</div>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Unit Price (MRP)</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div class="totals">
    <div class="row sub"><span>MRP Subtotal</span><span>₹${subtotal.toLocaleString("en-IN")}</span></div>
    <div class="row gst-row"><span>Taxable Value (excl. GST)</span><span>₹${taxableValue.toLocaleString("en-IN")}</span></div>
    <div class="row gst-row"><span>CGST @ 2.5%</span><span>₹${cgst.toLocaleString("en-IN")}</span></div>
    <div class="row gst-row"><span>SGST @ 2.5%</span><span>₹${sgst.toLocaleString("en-IN")}</span></div>
    <div class="row divider"><span>Delivery Charges</span><span>₹${delivery.toLocaleString("en-IN")}</span></div>
    <div class="row"><span>Grand Total</span><span>₹${grandTotal.toLocaleString("en-IN")}</span></div>
  </div>
  <p class="gst-note">* GST @ 5% is included in the MRP. CGST 2.5% + SGST 2.5% = ₹${gstTotal.toLocaleString("en-IN")} (back-calculated)</p>

  <div class="footer">
    Thank you for shopping with Shatakshi Herbal!<br>
    For queries: 📞 9754468444 &nbsp;|&nbsp; ✉ shatakshiherbal2015@gmail.com<br>
    Bypass Road, Near Chitragupt School, Shivaji Ward, Gadarwara, Narsinghpur, M.P – 487551<br>
    This is a computer-generated Tax Invoice and does not require a physical signature.
  </div>

  <script>window.onload=function(){setTimeout(function(){window.print()},500)}</script>
</body>
</html>`;
}

export function downloadInvoice(order: InvoiceData) {
  const html = getInvoiceHtml(order);
  const invoiceNumber = generateInvoiceNumber(order.id, order.created_at);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `shatakshi-herbal-${invoiceNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
