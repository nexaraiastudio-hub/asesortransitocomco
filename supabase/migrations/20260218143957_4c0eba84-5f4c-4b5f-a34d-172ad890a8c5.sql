-- Update has_active_subscription to allow access until END of the expiration day
-- Colombia is UTC-5. We add 5 hours so that "current_period_end" at 04:59:59 UTC (= 23:59:59 COL)
-- is treated as end-of-day.
-- The period_end is already stored as 04:59:59 UTC (23:59:59 COL), so the existing
-- comparison (current_period_end > now()) naturally grants access until midnight Colombia time.
-- No DB change needed for that â€” the edge function fix handles it.

-- However, we also want to ensure any OLD subscriptions (stored with midnight UTC) still work.
-- We update has_active_subscription to compare against end of day UTC+5 offset:
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      -- Grant access until end of expiration day in Colombia (UTC-5):
      -- We add 1 day and truncate to cover the full day of current_period_end
      AND (
        current_period_end IS NULL
        OR (current_period_end + INTERVAL '5 hours') > now()
      )
  )
$function$;