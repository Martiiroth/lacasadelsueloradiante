-- Fix admin user para consultas@lacasadelsueloradiante.es
-- Ejecutar en Supabase → SQL Editor
-- auth_uid del JWT: 71531ce1-a276-472a-acf0-bee809385d47

-- 1) Asegurar que existe el rol 'admin' (id = 4)
INSERT INTO public.customer_roles (id, name, description)
VALUES (4, 'admin', 'Administrador del sistema')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Si tu secuencia no tiene 4, usar:
-- INSERT INTO public.customer_roles (name, description)
-- VALUES ('admin', 'Administrador del sistema')
-- ON CONFLICT (name) DO NOTHING;

-- 2) Crear o actualizar la fila en clients para tu usuario (rol admin)
INSERT INTO public.clients (
  auth_uid,
  role_id,
  first_name,
  last_name,
  email,
  is_active
) VALUES (
  '71531ce1-a276-472a-acf0-bee809385d47',
  4,
  'admin',
  'admin',
  'consultas@lacasadelsueloradiante.es',
  true
)
ON CONFLICT (auth_uid) DO UPDATE SET
  role_id = 4,
  updated_at = now();

-- 3) Comprobar resultado
SELECT c.id, c.auth_uid, c.email, c.role_id, r.name AS role_name
FROM public.clients c
LEFT JOIN public.customer_roles r ON r.id = c.role_id
WHERE c.auth_uid = '71531ce1-a276-472a-acf0-bee809385d47';
