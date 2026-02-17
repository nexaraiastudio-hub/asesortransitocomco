-- Create a view for admin to see all users with subscriptions
-- Using a SECURITY DEFINER function so only admins can call it
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  role text,
  subscription_status text,
  subscription_end timestamp with time zone,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    p.id AS user_id,
    au.email::text,
    p.full_name,
    COALESCE(ur.role::text, 'user') AS role,
    COALESCE(s.status, 'none') AS subscription_status,
    s.current_period_end AS subscription_end,
    p.created_at
  FROM profiles p
  JOIN auth.users au ON au.id = p.id
  LEFT JOIN user_roles ur ON ur.user_id = p.id
  LEFT JOIN subscriptions s ON s.user_id = p.id
  ORDER BY p.created_at DESC;
END;
$$;

-- Function to get admin stats
CREATE OR REPLACE FUNCTION public.admin_get_stats()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'active_subscriptions', (SELECT COUNT(*) FROM subscriptions WHERE status = 'active' AND (current_period_end IS NULL OR current_period_end > now())),
    'inactive_subscriptions', (SELECT COUNT(*) FROM subscriptions WHERE status != 'active' OR (current_period_end IS NOT NULL AND current_period_end <= now())),
    'monthly_revenue', (SELECT COUNT(*) FROM subscriptions WHERE status = 'active' AND (current_period_end IS NULL OR current_period_end > now())) * 4900,
    'new_users_this_month', (SELECT COUNT(*) FROM profiles WHERE created_at >= date_trunc('month', now()))
  ) INTO result;

  RETURN result;
END;
$$;