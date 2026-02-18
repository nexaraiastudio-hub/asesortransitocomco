-- Block all direct user/anon writes to subscriptions table.
-- Service role (edge functions) bypasses RLS, so grant-premium and
-- verify-epayco-payment will continue to work without changes.
CREATE POLICY "Block user writes to subscriptions"
  ON public.subscriptions
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);