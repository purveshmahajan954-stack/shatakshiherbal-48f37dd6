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
  return `Shatakshi Herbal: Hi ${name}, your order is out for delivery today! AWB: ${awb}. Please be available. - Shatakshi Herbal`;
}

export function smsDelivered(name: string) {
  return `Shatakshi Herbal: Hi ${name}, your order has been delivered! We hope you enjoy your Ayurvedic products. For support, visit shatakshiherbal.com`;
}
