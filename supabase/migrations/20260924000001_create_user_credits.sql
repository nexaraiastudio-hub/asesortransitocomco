-- 20260924000001_create_user_credits.sql

CREATE TABLE IF NOT EXISTS public.user_credits (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT balance_non_negative CHECK (balance >= 0)
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credits"
ON public.user_credits FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $BODY$
BEGIN
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (new.id, 3)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$BODY$;

DROP TRIGGER IF EXISTS on_auth_user_created_give_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_give_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();

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
  
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT (status = 'active') INTO v_is_premium 
  FROM public.subscriptions 
  WHERE user_id = v_user_id 
  ORDER BY updated_at DESC 
  LIMIT 1;

  IF v_is_premium THEN
    RETURN TRUE;
  END IF;

  SELECT balance INTO v_balance 
  FROM public.user_credits 
  WHERE user_id = v_user_id 
  FOR UPDATE;

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

REVOKE EXECUTE ON FUNCTION public.consume_credit() FROM public;
REVOKE EXECUTE ON FUNCTION public.consume_credit() FROM anon;
GRANT EXECUTE ON FUNCTION public.consume_credit() TO authenticated;