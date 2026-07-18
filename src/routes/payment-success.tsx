import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useState } from "react";
import { CheckCircle2, Package, ArrowRight, Truck, Copy, FileDown, X, Printer } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getMyOrder } from "@/lib/payments.functions";
import { downloadInvoice } from "@/lib/invoice";

export const Route = createFileRoute("/payment-success")({
  validateSearch: z.object({ o: z.string().uuid().optional() }),
  head: () => ({
    meta: [
      { title: "Payment Successful — Shatakshi Herbal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuccessPage,
});

function generateInvoiceNumber(orderId: string, createdAt: string): string {
  const d = new Date(createdAt);
  const ymd =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  const suffix = orderId.replace(/-/g, "").slice(0, 4).toUpperCase();
  return `INV-${ymd}-${suffix}`;
}

function InvoiceModal({ order, onClose, onDownload }: { order: any; onClose: () => void; onDownload: () => void }) {
  const items: { name: string; qty: number; price: number }[] = Array.isArray(order.items) ? order.items : [];
  const subtotal = Number(order.subtotal) || 0;
  const delivery = Number(order.delivery_charge) || 0;
  const grandTotal = subtotal + delivery;
  const invoiceNumber = generateInvoiceNumber(order.id, order.created_at);
  const date = new Date(order.created_at).toLocaleDateString("en-IN", { dateStyle: "long" });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-primary/5">
          <h3 className="font-display text-xl text-primary">Invoice Preview</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Brand + Meta */}
          <div className="flex justify-between items-start border-b border-border pb-5">
            <div>
              <div className="font-display text-2xl text-primary font-bold">🌿 SHATAKSHI HERBAL</div>
              <div className="text-xs text-muted-foreground mt-1">Pure Ayurvedic · AYUSH Certified · 100% Natural</div>
              <div className="text-xs text-muted-foreground">www.shatakshiherbal.com</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold tracking-widest text-primary">INVOICE</div>
              <div className="text-xs text-muted-foreground mt-1"><span className="font-medium">Invoice No:</span> {invoiceNumber}</div>
              <div className="text-xs text-muted-foreground"><span className="font-medium">Order:</span> #{order.id.slice(0, 8).toUpperCase()}</div>
              <div className="text-xs text-muted-foreground"><span className="font-medium">Date:</span> {date}</div>
            </div>
          </div>

          {/* Bill To + Payment */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-cream/50 rounded-xl p-4">
              <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2">Billed To</div>
              <div className="font-semibold text-sm">{order.shipping_name || "—"}</div>
              {order.email && <div className="text-xs text-muted-foreground">{order.email}</div>}
              {order.shipping_phone && <div className="text-xs text-muted-foreground">📞 {order.shipping_phone}</div>}
              {order.shipping_address && <div className="text-xs text-muted-foreground mt-1">{order.shipping_address}</div>}
            </div>
            <div className="bg-cream/50 rounded-xl p-4">
              <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2">Payment Details</div>
              <div className="text-xs space-y-1">
                <div><span className="font-medium">Method:</span> {order.payment_method === "cod" ? "Cash on Delivery" : order.razorpay_payment_id ? "Online (Razorpay)" : "—"}</div>
                <div><span className="font-medium">Status:</span> <span className="text-primary font-semibold capitalize">{order.payment_status}</span></div>
                {order.razorpay_payment_id && (
                  <div className="font-mono text-[10px] text-muted-foreground break-all">{order.razorpay_payment_id}</div>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2">Order Items</div>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold">Product</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold">Qty</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold">Price</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx} className="border-t border-border">
                      <td className="px-4 py-2.5">{it.name}</td>
                      <td className="px-4 py-2.5 text-center">{it.qty}</td>
                      <td className="px-4 py-2.5 text-right">₹{Number(it.price).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">₹{(Number(it.price) * it.qty).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="ml-auto w-full sm:w-72 border border-border rounded-xl overflow-hidden">
            <div className="flex justify-between px-4 py-2.5 text-sm border-b border-border">
              <span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5 text-sm border-b border-border">
              <span>Delivery Charges</span><span>₹{delivery.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between px-4 py-3 text-base font-bold bg-primary text-primary-foreground">
              <span>Total Amount</span><span>₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Thank you for shopping with Shatakshi Herbal! · support@shatakshiherbal.com<br />
            This is a computer-generated invoice and does not require a physical signature.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-border flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm border border-border rounded-full hover:bg-muted font-medium"
          >
            Close
          </button>
          <button
            onClick={onDownload}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm bg-primary text-primary-foreground rounded-full font-semibold hover:opacity-90 transition"
          >
            <Printer className="w-4 h-4" /> Print / Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessPage() {
  const { o } = Route.useSearch();
  const fetchOrder = useServerFn(getMyOrder);
  const { data } = useQuery({
    queryKey: ["order", o],
    queryFn: () => fetchOrder({ data: { id: o! } }),
    enabled: !!o,
    staleTime: 5 * 60 * 1000,
  });
  const order = data?.order;
  const [showModal, setShowModal] = useState(false);

  const handleDownload = () => {
    if (order) downloadInvoice(order as any);
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream/40">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-16">
        <div className="bg-white rounded-2xl shadow-card p-8 sm:p-12 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-5 animate-in zoom-in duration-500">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl mb-2">Order Placed Successfully</h1>
          <p className="text-muted-foreground mb-8">Thank you for your order. A confirmation email is on its way.</p>

          {order && (
            <>
              {order.tracking_id && (
                <div className="bg-primary/5 border-2 border-dashed border-primary/30 rounded-xl p-5 mb-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Your Tracking ID</div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-2xl font-bold text-primary">{order.tracking_id}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(order.tracking_id!);
                        toast.success("Tracking ID copied");
                      }}
                      className="p-1.5 rounded hover:bg-primary/10"
                      aria-label="Copy tracking ID"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              )}
              <div className="text-left bg-cream/50 rounded-xl p-5 space-y-2 text-sm border border-border">
                <div className="flex justify-between"><span className="text-muted-foreground">Order ID</span><span className="font-mono">#{order.id.slice(0, 8).toUpperCase()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">₹{order.total}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment ID</span><span className="font-mono text-xs">{order.razorpay_payment_id}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="text-primary font-semibold capitalize">{order.payment_status}</span></div>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowModal(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/30 px-6 py-3 rounded-full font-semibold hover:bg-primary/20 transition"
                >
                  <FileDown className="w-4 h-4" /> View &amp; Download Invoice
                </button>
              </div>
            </>
          )}

          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
            {order?.awb_number ? (
              <a
                href={`https://ckship.in/tracking/${order.awb_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:opacity-90"
              >
                <Truck className="w-4 h-4" /> Track Order
              </a>
            ) : order?.tracking_id ? (
              <div className="inline-flex items-center justify-center gap-2 bg-muted text-muted-foreground px-6 py-3 rounded-full font-semibold text-sm">
                <Truck className="w-4 h-4" /> Tracking available once shipped
              </div>
            ) : null}
            <Link to="/orders" className="inline-flex items-center justify-center gap-2 border border-border px-6 py-3 rounded-full font-semibold hover:bg-cream">
              <Package className="w-4 h-4" /> My Orders
            </Link>
            <Link to="/shop" className="inline-flex items-center justify-center gap-2 border border-border px-6 py-3 rounded-full font-semibold hover:bg-cream">
              Continue Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />

      {showModal && order && (
        <InvoiceModal
          order={order}
          onClose={() => setShowModal(false)}
          onDownload={() => { handleDownload(); }}
        />
      )}
    </div>
  );
}
