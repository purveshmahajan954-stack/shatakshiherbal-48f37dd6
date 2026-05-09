
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM authenticated;

DROP POLICY "Anyone can submit contact" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact" ON public.contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(trim(name)) BETWEEN 1 AND 200
    AND length(trim(email)) BETWEEN 3 AND 320
    AND length(trim(message)) BETWEEN 1 AND 5000
  );
