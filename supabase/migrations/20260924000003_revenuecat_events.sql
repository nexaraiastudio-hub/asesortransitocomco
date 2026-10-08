-- 20260924000003_revenuecat_events.sql
CREATE TABLE IF NOT EXISTS public.revenuecat_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    app_user_id TEXT NOT NULL,
    original_app_user_id TEXT,
    entitlement_id TEXT,
    event_timestamp_ms BIGINT,
    store TEXT,
    environment TEXT,
    product_id TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.revenuecat_events ENABLE ROW LEVEL SECURITY;

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