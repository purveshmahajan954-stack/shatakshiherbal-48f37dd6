
-- 1) Orders: require user_id = auth.uid() on INSERT
CREATE POLICY "Users insert own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2) Lock down user_roles writes to service_role only.
-- Remove all authenticated write policies; role management must go through
-- trusted server-side code using the service role key.
DROP POLICY IF EXISTS "Admins insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins delete roles" ON public.user_roles;
