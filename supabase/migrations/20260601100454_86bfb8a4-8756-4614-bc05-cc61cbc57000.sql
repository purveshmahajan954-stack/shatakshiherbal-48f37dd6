-- Add tracking fields to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS tracking_status text NOT NULL DEFAULT 'Order Placed',
  ADD COLUMN IF NOT EXISTS tracking_location text,
  ADD COLUMN IF NOT EXISTS tracking_eta text,
  ADD COLUMN IF NOT EXISTS tracking_updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_orders_tracking_id ON public.orders(tracking_id);

-- Allow public lookups by tracking_id (read-only, no PII columns will be exposed via API layer filtering)
CREATE POLICY "Public can view orders by tracking_id"
ON public.orders
FOR SELECT
TO anon, authenticated
USING (tracking_id IS NOT NULL);

GRANT SELECT ON public.orders TO anon;