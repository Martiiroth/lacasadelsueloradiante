-- ============================================================
-- CORRECCIONES PARA EL SISTEMA DE AUTENTICACIÓN
-- ============================================================

-- Actualizar función handle_new_user para ser más robusta
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_first_name TEXT;
  user_last_name TEXT;
  full_name_from_meta TEXT;
BEGIN
  -- Obtener datos del metadata
  full_name_from_meta := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  -- Extraer first_name, con fallback
  user_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NULLIF(split_part(full_name_from_meta, ' ', 1), ''),
    'Usuario'
  );
  
  -- Extraer last_name, con fallback
  user_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NULLIF(split_part(full_name_from_meta, ' ', 2), ''),
    ''
  );

  -- Insertar en la tabla clients con manejo de errores
  INSERT INTO public.clients (
    auth_uid, 
    email, 
    first_name, 
    last_name,
    phone,
    nif_cif,
    region,
    city,
    address_line1,
    address_line2,
    postal_code,
    activity,
    company_name,
    company_position
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    user_first_name,
    user_last_name,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'nif_cif',
    NEW.raw_user_meta_data->>'region',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'address_line1',
    NEW.raw_user_meta_data->>'address_line2',
    NEW.raw_user_meta_data->>'postal_code',
    NEW.raw_user_meta_data->>'activity',
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'company_position'
  )
  ON CONFLICT (auth_uid) DO NOTHING; -- Evitar duplicados

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log del error (esto aparecerá en los logs de Supabase)
    RAISE WARNING 'Error creating client for user %: %', NEW.id, SQLERRM;
    -- Continuar con la creación del usuario de auth aunque falle el cliente
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- INSERTAR ROLES BÁSICOS SI NO EXISTEN
-- ============================================================
INSERT INTO customer_roles (name, description) VALUES
  ('guest', 'Usuario invitado con acceso básico'),
  ('instalador', 'Profesional instalador con precios especiales'),
  ('sat', 'Servicio técnico con acceso completo'),
  ('admin', 'Administrador del sistema')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- FUNCIÓN PARA ACTUALIZAR ROLE POR DEFECTO
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_default_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Si no tiene role asignado, asignar 'guest' por defecto
  IF NEW.role_id IS NULL THEN
    NEW.role_id := (SELECT id FROM customer_roles WHERE name = 'guest' LIMIT 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para asignar role por defecto
DROP TRIGGER IF EXISTS set_default_role_trigger ON clients;
CREATE TRIGGER set_default_role_trigger
  BEFORE INSERT ON clients
  FOR EACH ROW EXECUTE FUNCTION public.set_default_role();