
-- 1. Prevent privilege escalation on user_roles: restrictive policy blocking non-admin write ops
CREATE POLICY "Only admins can modify roles (restrictive)"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Add explicit INSERT policy on profiles (auth.uid() = id)
CREATE POLICY "Users insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 3. Realtime: restrict channel subscriptions to user's own order topic ("orders:<uid>")
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users subscribe to own order channel" ON realtime.messages;
CREATE POLICY "Users subscribe to own order channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = ('orders:' || auth.uid()::text)
);

-- 4. Convert has_role to SECURITY INVOKER (caller can read own roles via existing RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$function$;
