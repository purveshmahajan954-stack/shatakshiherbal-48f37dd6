DROP POLICY IF EXISTS "Public can view orders by tracking_id" ON public.orders;
REVOKE SELECT ON public.orders FROM anon;