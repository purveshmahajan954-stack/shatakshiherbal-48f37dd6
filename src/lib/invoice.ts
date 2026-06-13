type InvoiceItem = { name: string; qty: number; price: number };

type InvoiceData = {
  id: string;
  shipping_name?: string | null;
  shipping_phone?: string | null;
  email?: string | null;
  shipping_address?: string | null;
  items: InvoiceItem[];
  subtotal: number;
  delivery_charge: number;
  total: number;
  payment_status: string;
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
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;border-bottom:3px solid #2D5016;padding-bottom:24px}
  .brand h1{font-size:22px;font-weight:800;color:#2D5016;letter-spacing:-0.5px}
  .brand p{font-size:11px;color:#666;margin-top:4px}
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
  .totals{margin-left:auto;width:280px;border:1px solid #eee;border-radius:8px;overflow:hidden}
  .totals .row{display:flex;justify-content:space-between;padding:9px 14px;font-size:13px;border-bottom:1px solid #eee}
  .totals .row:last-child{background:#2D5016;color:#fff;font-weight:700;font-size:15px;border-bottom:none;padding:12px 14px}
  .footer{margin-top:40px;padding-top:20px;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center;line-height:1.6}
  @media print{body{padding:20px}@page{margin:1cm}}
</style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>🌿 SHATAKSHI HERBAL</h1>
      <p>Pure Ayurvedic · AYUSH Certified · 100% Natural</p>
      <p style="margin-top:2px">www.shatakshiherbal.com</p>
      <p style="margin-top:2px;color:#2D5016;font-size:10px">GST: 27AABCS1234A1Z5</p>
    </div>
    <div class="invoice-meta">
      <h2>INVOICE</h2>
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
        <strong>Method:</strong> ${(order.razorpay_payment_id || order.payment_status === "paid" || order.payment_status === "confirmed") ? "Online (Razorpay)" : "—"}<br>
        <strong>Status:</strong> <span style="color:#2D5016;font-weight:600;text-transform:capitalize">${order.payment_status}</span><br>
        ${order.razorpay_payment_id ? `<strong>Payment ID:</strong><br><span style="font-size:11px;font-family:monospace">${order.razorpay_payment_id}</span>` : ""}
      </div>
    </div>
  </div>

  <div>
    <div class="section-title">Order Items</div>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Unit Price</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div class="totals">
    <div class="row"><span>Subtotal</span><span>₹${subtotal.toLocaleString("en-IN")}</span></div>
    <div class="row"><span>Delivery Charges</span><span>₹${delivery.toLocaleString("en-IN")}</span></div>
    <div class="row"><span>Total Amount</span><span>₹${grandTotal.toLocaleString("en-IN")}</span></div>
  </div>

  <div class="footer">
    Thank you for shopping with Shatakshi Herbal!<br>
    For queries, contact us at support@shatakshiherbal.com · +91-XXXXXXXXXX<br>
    This is a computer-generated invoice and does not require a physical signature.
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
