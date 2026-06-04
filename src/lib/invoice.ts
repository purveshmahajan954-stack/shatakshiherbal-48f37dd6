export interface InvoiceOrder {
  id: string;
  shippingName: string | null;
  email: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  items: { name: string; qty: number; price: number }[];
  subtotal: number | string;
  deliveryCharge: number | string;
  total: number | string;
  razorpayPaymentId?: string | null;
  razorpay_payment_id?: string | null;
  paymentStatus?: string | null;
  payment_status?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
}

export async function downloadInvoice(order: InvoiceOrder) {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 40;

  const primary = [45, 80, 22] as [number, number, number];
  const dark = [30, 30, 30] as [number, number, number];
  const muted = [100, 100, 100] as [number, number, number];
  const light = [245, 240, 230] as [number, number, number];

  doc.setFillColor(...primary);
  doc.rect(0, 0, W, 80, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Shatakshi Herbal", margin, 35);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Ayurvedic & Herbal Products", margin, 52);
  doc.text("INVOICE", W - margin, 35, { align: "right" });
  doc.setFontSize(9);
  doc.text(`Order ID: #${order.id.slice(0, 8).toUpperCase()}`, W - margin, 52, { align: "right" });
  const createdAt = order.createdAt ?? order.created_at;
  doc.text(
    createdAt ? new Date(createdAt).toLocaleDateString("en-IN", { dateStyle: "long" }) : new Date().toLocaleDateString("en-IN", { dateStyle: "long" }),
    W - margin,
    64,
    { align: "right" }
  );

  y = 110;
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("BILL TO", margin, y);
  doc.setDrawColor(...primary);
  doc.setLineWidth(1.5);
  doc.line(margin, y + 4, margin + 60, y + 4);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  doc.text(order.shippingName ?? "Customer", margin, y);
  y += 14;
  if (order.email) { doc.setTextColor(...muted); doc.text(order.email, margin, y); y += 14; }
  if (order.shippingPhone) { doc.setTextColor(...muted); doc.text(order.shippingPhone, margin, y); y += 14; }
  if (order.shippingAddress) {
    doc.setTextColor(...muted);
    const lines = doc.splitTextToSize(order.shippingAddress, 200);
    doc.text(lines, margin, y);
    y += lines.length * 14;
  }

  const paymentId = order.razorpayPaymentId ?? order.razorpay_payment_id;
  const payStatus = order.paymentStatus ?? order.payment_status ?? "—";
  const rightCol = W - margin - 160;
  let ry = 110;
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("PAYMENT DETAILS", rightCol, ry);
  doc.line(rightCol, ry + 4, rightCol + 120, ry + 4);
  ry += 18;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...muted);
  const details = [
    ["Method:", paymentId ? "Online (Razorpay)" : "—"],
    ["Status:", payStatus.charAt(0).toUpperCase() + payStatus.slice(1)],
    ...(paymentId ? [["Payment ID:", paymentId.slice(0, 20)]] : []),
  ] as [string, string][];
  for (const [label, value] of details) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...dark);
    doc.text(label, rightCol, ry);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...muted);
    doc.text(value, rightCol + 72, ry);
    ry += 14;
  }

  y = Math.max(y, ry) + 24;

  doc.setFillColor(...light);
  doc.rect(margin, y, W - margin * 2, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...dark);
  doc.text("ITEM", margin + 8, y + 15);
  doc.text("QTY", W - margin - 140, y + 15, { align: "right" });
  doc.text("UNIT PRICE", W - margin - 70, y + 15, { align: "right" });
  doc.text("AMOUNT", W - margin, y + 15, { align: "right" });
  y += 22;

  const items = Array.isArray(order.items) ? order.items : [];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (i % 2 === 1) {
      doc.setFillColor(250, 248, 244);
      doc.rect(margin, y, W - margin * 2, 20, "F");
    }
    doc.setTextColor(...dark);
    const nameLines = doc.splitTextToSize(item.name, 220);
    doc.text(nameLines, margin + 8, y + 13);
    doc.setTextColor(...muted);
    doc.text(String(item.qty), W - margin - 140, y + 13, { align: "right" });
    doc.text(`Rs.${Number(item.price).toLocaleString("en-IN")}`, W - margin - 70, y + 13, { align: "right" });
    doc.setTextColor(...dark);
    doc.text(`Rs.${(Number(item.price) * Number(item.qty)).toLocaleString("en-IN")}`, W - margin, y + 13, { align: "right" });
    y += Math.max(20, nameLines.length * 12 + 8);
  }

  y += 10;
  doc.setDrawColor(220, 215, 205);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 14;

  const summaryLeft = W - margin - 200;
  function summaryRow(label: string, value: string, bold = false) {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 10 : 9);
    if (bold) doc.setTextColor(...dark); else doc.setTextColor(...muted);
    doc.text(label, summaryLeft, y);
    doc.setTextColor(...dark);
    doc.text(value, W - margin, y, { align: "right" });
    y += 16;
  }

  const sub = Number(order.subtotal);
  const delivery = Number(order.deliveryCharge);
  const total = Number(order.total);

  summaryRow("Subtotal", `Rs.${sub.toLocaleString("en-IN")}`);
  summaryRow("Delivery Charge", `Rs.${delivery.toLocaleString("en-IN")}`);

  y += 2;
  doc.setFillColor(...primary);
  doc.rect(summaryLeft - 8, y - 2, W - margin - summaryLeft + 8 + margin, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL", summaryLeft, y + 14);
  doc.text(`Rs.${total.toLocaleString("en-IN")}`, W - margin, y + 14, { align: "right" });
  y += 30;

  y = doc.internal.pageSize.getHeight() - 50;
  doc.setDrawColor(...primary);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...muted);
  doc.text("Thank you for choosing Shatakshi Herbal! For any queries, contact us at shatakshiherbal@gmail.com", W / 2, y, { align: "center" });

  doc.save(`Invoice_${order.id.slice(0, 8).toUpperCase()}.pdf`);
}
