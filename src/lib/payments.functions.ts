export const COURIER_CHARGE = 150;

export function computeTotals(subtotal: number) {
  const sub = Math.max(0, Math.round(subtotal));
  const delivery = sub === 0 ? 0 : COURIER_CHARGE;
  return { subtotal: sub, gst: 0, delivery, total: sub + delivery };
}
