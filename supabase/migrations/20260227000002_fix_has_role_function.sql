-- FIX: has_role usando text para evitar dependencia del enum app_role
-- Si el tipo app_role no existe aún, esto garantiza que la función funcione igual.

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = _role
  );
END;
$$;

-- Garantizar que los usuarios de confianza tienen rol admin
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'nexaraiastudio@gmail.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RAISE NOTICE 'Admin role ensured for nexaraiastudio@gmail.com (%)', v_user_id;
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'bermudezcarlose1977@gmail.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RAISE NOTICE 'Admin role ensured for bermudezcarlose1977@gmail.com (%)', v_user_id;
  END IF;
END $$;
