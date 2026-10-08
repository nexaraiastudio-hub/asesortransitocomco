-- â”€â”€ USUARIOS DE CONFIANZA â€” acceso directo sin pasarela de pagos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- nexaraiastudio@gmail.com  â†’ rol admin  (administrador)
-- bermudezcarlose1977@gmail.com â†’ rol admin (usuario de pruebas con acceso completo)

-- 1. FunciÃ³n reutilizable que asigna el rol admin a un usuario por email exacto
CREATE OR REPLACE FUNCTION public.assign_trusted_user_role(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(p_email)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- 2. Trigger que asigna automÃ¡ticamente el rol admin cuando se registra
--    uno de los correos de confianza
CREATE OR REPLACE FUNCTION public.handle_trusted_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) IN (
    'nexaraiastudio@gmail.com',
    'bermudezcarlose1977@gmail.com'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Trigger sobre auth.users (se dispara DESPUÃ‰S del trigger handle_new_user
--    para que el perfil ya exista)
DROP TRIGGER IF EXISTS on_trusted_user_signup ON auth.users;
CREATE TRIGGER on_trusted_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_trusted_user_signup();

-- 4. Aplicar a usuarios que YA estÃ©n registrados en el sistema
SELECT public.assign_trusted_user_role('nexaraiastudio@gmail.com');
SELECT public.assign_trusted_user_role('bermudezcarlose1977@gmail.com');
