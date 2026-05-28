-- Remove client INSERT path for orders; all orders are created server-side via service role
DROP POLICY IF EXISTS "Users insert own orders" ON public.orders;

-- Remove orders from realtime publication (not used by app, avoids any broadcast-mode concerns)
ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;