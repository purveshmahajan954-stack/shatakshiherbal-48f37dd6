import { db } from "@server/db";
import { paymentEvents } from "@shared/schema";

// ─── SMS (Twilio) ────────────────────────────────────────────────────────────

export async function sendSMS(to: string, body: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !authToken || !from) {
    console.log("[SMS] Twilio not configured, skipping:", body.slice(0, 80));
    return;
  }

  const digits = to.replace(/\D/g, "");
  const phone = to.startsWith("+") ? to : `+91${digits.slice(-10)}`;

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${sid}:${authToken}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phone, From: from, Body: body }).toString(),
      }
    );
    const data: any = await res.json();
    if (!res.ok) {
      console.error("[SMS] Twilio error:", data?.message || data?.code);
    } else {
      console.log("[SMS] Sent to", phone, "SID:", data.sid);
    }
  } catch (err) {
    console.error("[SMS] Failed to send:", err);
  }
}

export function smsOrderConfirmed(name: string, orderId: string, total: string | number) {
  const shortId = orderId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `Shatakshi Herbal: Hi ${name}, your order #${shortId} worth Rs.${Number(total).toFixed(0)} is confirmed! We'll notify you when it ships. Thank you!`;
}

export function smsShipmentCreated(name: string, awb: string, courier: string, trackingId?: string | null) {
  const trackPart = trackingId ? ` Track: shatakshiherbal.com/track/${trackingId}` : "";
  return `Shatakshi Herbal: Hi ${name}, your order is shipped via ${courier}. AWB: ${awb}.${trackPart}`;
}

export function smsOutForDelivery(name: string, awb: string) {
  return `Shatakshi Herbal: Hi ${name}, your order is out for delivery today! AWB: ${awb}. Please be available.`;
}

export function smsDelivered(name: string) {
  return `Shatakshi Herbal: Hi ${name}, your order has been delivered! We hope you enjoy your Ayurvedic products.`;
}

// ─── WhatsApp via CallMeBot ───────────────────────────────────────────────────

export async function sendWhatsApp(message: string): Promise<void> {
  const apiKey = process.env.CALLMEBOT_API_KEY;
  const phone  = process.env.CALLMEBOT_PHONE; // e.g. 918485838126

  if (!apiKey || !phone) {
    console.log("[WhatsApp] CallMeBot not configured (CALLMEBOT_API_KEY / CALLMEBOT_PHONE missing), skipping");
    return;
  }

  const encoded = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`;

  try {
    console.log("[WhatsApp] Sending via CallMeBot to", phone, "...");
    const res = await fetch(url);
    const text = await res.text();
    if (!res.ok) {
      console.error("[WhatsApp] ❌ CallMeBot error:", res.status, text.slice(0, 200));
      throw new Error(`CallMeBot HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    console.log("[WhatsApp] ✅ CallMeBot response:", text.slice(0, 120));
  } catch (err: any) {
    console.error("[WhatsApp] ❌ Failed:", err?.message || err);
    throw err;
  }
}

// ─── Email (Nodemailer / Gmail) ───────────────────────────────────────────────

export async function sendEmail(subject: string, html: string): Promise<void> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to   = process.env.ADMIN_NOTIFY_EMAIL || user;

  if (!user || !pass || !to) {
    console.log("[Email] Not configured (GMAIL_USER / GMAIL_APP_PASSWORD missing), skipping");
    return;
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
    const info = await transporter.sendMail({
      from: `"Shatakshi Herbal" <${user}>`,
      to,
      subject,
      html,
    });
    console.log("[Email] ✅ Sent:", info.messageId, "→", to);
  } catch (err: any) {
    console.error("[Email] ❌ Failed:", err?.message || err);
    throw err;
  }
}

function buildOrderEmailHtml(order: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: string | number;
  items: Array<{ name: string; qty: number; price: number }>;
  address: string;
  razorpayPaymentId?: string;
  timestamp: string;
}) {
  const shortId = order.orderId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const itemRows = order.items.map(
    (i) => `<tr>
      <td style="padding:6px 12px;border-bottom:1px solid #eee">${i.name}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center">${i.qty}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">₹${i.price}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">₹${i.price * i.qty}</td>
    </tr>`
  ).join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px">
  <div style="background:#2d6a4f;color:white;padding:20px 24px;border-radius:8px 8px 0 0">
    <h2 style="margin:0">🌿 New Order — Shatakshi Herbal</h2>
    <p style="margin:4px 0 0;opacity:0.85">Order #${shortId} · ${order.timestamp}</p>
  </div>
  <div style="background:white;padding:24px;border:1px solid #e0e0e0;border-top:none">
    <h3 style="color:#2d6a4f;margin-top:0">Customer Details</h3>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:4px 0;color:#666;width:140px">Name</td><td><strong>${order.customerName}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#666">Email</td><td>${order.customerEmail}</td></tr>
      <tr><td style="padding:4px 0;color:#666">Phone</td><td>${order.customerPhone}</td></tr>
      <tr><td style="padding:4px 0;color:#666">Address</td><td>${order.address}</td></tr>
      ${order.razorpayPaymentId ? `<tr><td style="padding:4px 0;color:#666">Payment ID</td><td><code>${order.razorpayPaymentId}</code></td></tr>` : ""}
    </table>
    <h3 style="color:#2d6a4f;margin-top:20px">Order Items</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#f0f7f4">
        <th style="padding:8px 12px;text-align:left">Product</th>
        <th style="padding:8px 12px;text-align:center">Qty</th>
        <th style="padding:8px 12px;text-align:right">Price</th>
        <th style="padding:8px 12px;text-align:right">Total</th>
      </tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <div style="text-align:right;margin-top:12px;font-size:18px"><strong>Total: ₹${Number(order.amount).toFixed(0)}</strong></div>
  </div>
</body></html>`;
}

// ─── Telegram ────────────────────────────────────────────────────────────────

export async function sendTelegram(message: string): Promise<void> {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log("[Telegram] Not configured, skipping");
    return;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
    });
    const data: any = await res.json();
    if (!data.ok) {
      console.error("[Telegram] ❌ API error:", data.description);
      throw new Error(data.description);
    }
    console.log("[Telegram] ✅ Sent, message_id:", data.result?.message_id);
  } catch (err: any) {
    console.error("[Telegram] ❌ Failed:", err?.message || err);
    throw err;
  }
}

// ─── Payment Event Logger ─────────────────────────────────────────────────────

export async function logPaymentEvent(params: {
  orderId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  event: string;
  amount?: string | number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items?: Array<{ name: string; qty: number; price: number }>;
  notificationsSent?: {
    email?: boolean; telegram?: boolean; sms?: boolean; whatsapp?: boolean;
    emailError?: string; telegramError?: string; whatsappError?: string;
  };
  rawPayload?: any;
}): Promise<void> {
  try {
    await db.insert(paymentEvents).values({
      orderId: params.orderId ?? null,
      razorpayOrderId: params.razorpayOrderId ?? null,
      razorpayPaymentId: params.razorpayPaymentId ?? null,
      event: params.event,
      amount: params.amount != null ? String(params.amount) : null,
      customerName: params.customerName ?? null,
      customerEmail: params.customerEmail ?? null,
      customerPhone: params.customerPhone ?? null,
      items: params.items ?? null,
      notificationsSent: params.notificationsSent ?? {},
      rawPayload: params.rawPayload ?? null,
    });
    console.log(`[PaymentLog] ✅ Logged event "${params.event}" for order ${params.orderId ?? params.razorpayOrderId}`);
  } catch (err: any) {
    console.error("[PaymentLog] ❌ Failed to log event:", err?.message || err);
  }
}

// ─── Master Notifier ──────────────────────────────────────────────────────────

export async function notifyPaymentSuccess(order: {
  id: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  shippingName?: string | null;
  shippingPhone?: string | null;
  shippingAddress?: string | null;
  email?: string | null;
  total: string | number;
  items: Array<{ name: string; qty: number; price: number }>;
}): Promise<void> {
  const name    = order.shippingName    ?? "Customer";
  const phone   = order.shippingPhone   ?? "";
  const email   = order.email           ?? "";
  const address = order.shippingAddress ?? "";
  const amount  = Number(order.total);
  const shortId = order.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  console.log(`[Notify] 🚀 Payment success — Order #${shortId}, ₹${amount}, Customer: ${name}`);

  const notifications: {
    whatsapp?: boolean; email?: boolean; telegram?: boolean; sms?: boolean;
    whatsappError?: string; emailError?: string; telegramError?: string;
  } = {};

  // ── WhatsApp (CallMeBot) — Primary notification ──
  const waMsg =
    `🌿 *NEW ORDER — Shatakshi Herbal*\n\n` +
    `📦 Order: #${shortId}\n` +
    `👤 Customer: ${name}\n` +
    `📞 Phone: ${phone || "N/A"}\n` +
    `📧 Email: ${email || "N/A"}\n` +
    `💰 Amount: *₹${amount}*\n` +
    `🕒 Time: ${timestamp}\n\n` +
    `🛍 Items:\n` +
    order.items.map((i) => `  • ${i.name} x${i.qty} = ₹${i.price * i.qty}`).join("\n") +
    `\n\n📍 Address: ${address || "N/A"}` +
    (order.razorpayPaymentId ? `\n💳 Payment ID: ${order.razorpayPaymentId}` : "");

  try {
    await sendWhatsApp(waMsg);
    notifications.whatsapp = true;
    console.log("[Notify] ✅ WhatsApp sent");
  } catch (err: any) {
    notifications.whatsapp = false;
    notifications.whatsappError = err?.message?.slice(0, 200) ?? "unknown";
    console.error("[Notify] ❌ WhatsApp failed:", notifications.whatsappError);
  }

  // ── Email ──
  try {
    await sendEmail(
      `🌿 New Order #${shortId} — ₹${amount} — ${name}`,
      buildOrderEmailHtml({
        orderId: order.id,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        amount,
        items: order.items,
        address,
        razorpayPaymentId: order.razorpayPaymentId,
        timestamp,
      })
    );
    notifications.email = true;
  } catch (err: any) {
    notifications.email = false;
    notifications.emailError = err?.message?.slice(0, 200) ?? "unknown";
  }

  // ── Telegram ──
  const tgMsg =
    `🌿 <b>New Order — Shatakshi Herbal</b>\n\n` +
    `📦 Order: <code>#${shortId}</code>\n` +
    `👤 Customer: ${name}\n` +
    `📞 Phone: ${phone || "N/A"}\n` +
    `📧 Email: ${email || "N/A"}\n` +
    `💰 Amount: <b>₹${amount}</b>\n` +
    `🕒 Time: ${timestamp}\n\n` +
    `🛍 Items:\n` +
    order.items.map((i) => `  • ${i.name} × ${i.qty} = ₹${i.price * i.qty}`).join("\n") +
    `\n\n📍 Address: ${address || "N/A"}` +
    (order.razorpayPaymentId ? `\n💳 Payment ID: ${order.razorpayPaymentId}` : "");

  try {
    await sendTelegram(tgMsg);
    notifications.telegram = true;
  } catch (err: any) {
    notifications.telegram = false;
    notifications.telegramError = err?.message?.slice(0, 200) ?? "unknown";
  }

  // ── Log to DB ──
  await logPaymentEvent({
    orderId: order.id,
    razorpayOrderId: order.razorpayOrderId,
    razorpayPaymentId: order.razorpayPaymentId,
    event: "payment.success",
    amount,
    customerName: name,
    customerEmail: email,
    customerPhone: phone,
    items: order.items,
    notificationsSent: notifications,
  });

  console.log("[Notify] ✅ All done. Results:", JSON.stringify(notifications));
}
