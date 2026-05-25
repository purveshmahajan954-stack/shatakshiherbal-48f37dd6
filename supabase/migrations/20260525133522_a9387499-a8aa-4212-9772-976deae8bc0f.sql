
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS subtotal numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_charge numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS razorpay_order_id text,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'created';

CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created_at ON public.orders(user_id, created_at DESC);
