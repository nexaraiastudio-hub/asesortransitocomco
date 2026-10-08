-- 20260925000001_atomic_revenuecat_rpc.sql
CREATE OR REPLACE FUNCTION public.consume_credit()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $BODY$
DECLARE
  v_user_id UUID;
  v_is_premium BOOLEAN;
  v_balance INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN FALSE; END IF;
  SELECT (status = 'active' AND current_period_end > now()) INTO v_is_premium 
  FROM public.subscriptions 
  WHERE user_id = v_user_id ORDER BY current_period_end DESC LIMIT 1;
  IF v_is_premium THEN RETURN TRUE; END IF;
  SELECT balance INTO v_balance FROM public.user_credits WHERE user_id = v_user_id FOR UPDATE;
  IF v_balance IS NULL THEN
    INSERT INTO public.user_credits (user_id, balance) VALUES (v_user_id, 2);
    RETURN TRUE;
  ELSIF v_balance > 0 THEN
    UPDATE public.user_credits SET balance = balance - 1, updated_at = now() WHERE user_id = v_user_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$BODY$;