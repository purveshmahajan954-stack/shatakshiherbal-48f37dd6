import { Check, Package, Truck, Home, Clock, XCircle } from "lucide-react";

export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered"] as const;
export type OrderStatus = typeof ORDER_STATUSES[number] | "cancelled";

const steps = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: Check },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Home },
] as const;

export function OrderStatusTracker({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-6 flex items-center gap-3">
        <XCircle className="w-6 h-6 text-destructive" />
        <div>
          <div className="font-semibold text-destructive">Order Cancelled</div>
          <div className="text-xs text-muted-foreground">This order has been cancelled.</div>
        </div>
      </div>
    );
  }

  const currentIdx = Math.max(0, ORDER_STATUSES.indexOf(status as any));

  return (
    <div className="bg-white rounded-2xl p-6 border border-border">
      <h2 className="font-display text-xl mb-5 flex items-center gap-2">
        <Package className="w-5 h-5 text-primary" />Order Status
      </h2>
      <div className="relative">
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-border" />
        <div
          className="absolute top-5 left-5 h-0.5 bg-primary transition-all duration-500"
          style={{ width: `calc((100% - 2.5rem) * ${currentIdx / (steps.length - 1)})` }}
        />
        <ol className="relative grid grid-cols-4 gap-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const done = idx <= currentIdx;
            const active = idx === currentIdx;
            return (
              <li key={step.key} className="flex flex-col items-center text-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    done
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-white border-border text-muted-foreground"
                  } ${active ? "ring-4 ring-primary/20" : ""}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className={`mt-2 text-xs font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
