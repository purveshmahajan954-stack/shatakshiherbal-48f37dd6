export const GST_RATE = 0.05;
export const COURIER_CHARGE = 150;

export function computeTotals(subtotal: number) {
  const sub = Math.max(0, Math.round(subtotal));
  const gst = Math.round(sub * GST_RATE);
  const delivery = sub === 0 ? 0 : COURIER_CHARGE;
  const total = sub + gst + delivery;
  return { subtotal: sub, gst, delivery, total };
}
