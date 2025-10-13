-- ===================================
-- CONFIGURACIÓN COMPLETA DE STORAGE
-- Ejecutar TODO este script en Supabase SQL Editor
-- ===================================

-- PASO 1: Verificar estado actual
SELECT 'DIAGNÓSTICO INICIAL' as step;

-- Ver todos los buckets existentes
SELECT 
  'Current buckets:' as info,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets;

-- PASO 2: Crear bucket si no existe
-- NOTA: Si esto da error, crear manualmente desde Storage Dashboard

DO $$
BEGIN
  -- Solo crear si no existe
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'brand-logos') THEN
    INSERT INTO storage.buckets (
      id, 
      name, 
      public, 
      file_size_limit, 
      allowed_mime_types,
      created_at,
      updated_at
    ) VALUES (
      'brand-logos',
      'brand-logos', 
      true,                    -- PÚBLICO
      2097152,                 -- 2MB
      ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      NOW(),
      NOW()
    );
    RAISE NOTICE 'Bucket brand-logos creado exitosamente';
  ELSE
    RAISE NOTICE 'Bucket brand-logos ya existe';
  END IF;
END $$;

-- PASO 3: Asegurar que el bucket es público
UPDATE storage.buckets 
SET public = true 
WHERE name = 'brand-logos';

-- PASO 4: Limpiar políticas existentes (por si hay conflictos)
DELETE FROM storage.policies WHERE bucket_id = 'brand-logos';

-- PASO 5: Crear políticas nuevas

-- Política 1: Lectura pública (crítica)
INSERT INTO storage.policies (
  name, 
  bucket_id, 
  policy_definition, 
  allowed_operation, 
  target
) VALUES (
  'Public read access for brand logos',
  'brand-logos',
  'true',
  'SELECT',
  'object'
);

-- Política 2: Subida autenticada  
INSERT INTO storage.policies (
  name, 
  bucket_id, 
  policy_definition, 
  allowed_operation, 
  target
) VALUES (
  'Authenticated upload for brand logos',
  'brand-logos',
  'auth.role() = ''authenticated''',
  'INSERT', 
  'object'
);

-- Política 3: Actualización autenticada
INSERT INTO storage.policies (
  name, 
  bucket_id, 
  policy_definition, 
  allowed_operation, 
  target
) VALUES (
  'Authenticated update for brand logos',
  'brand-logos',
  'auth.role() = ''authenticated''',
  'UPDATE',
  'object'
);

-- Política 4: Eliminación autenticada
INSERT INTO storage.policies (
  name, 
  bucket_id, 
  policy_definition, 
  allowed_operation, 
  target  
) VALUES (
  'Authenticated delete for brand logos',
  'brand-logos',
  'auth.role() = ''authenticated''',
  'DELETE',
  'object'
);

-- PASO 6: VERIFICACIÓN FINAL
SELECT 'VERIFICACIÓN FINAL' as step;

-- Verificar bucket
SELECT 
  'BUCKET STATUS' as check_type,
  name,
  public as is_public,
  file_size_limit,
  cardinality(allowed_mime_types) as mime_types_count
FROM storage.buckets 
WHERE name = 'brand-logos';

-- Verificar políticas
SELECT 
  'POLICIES STATUS' as check_type,
  name,
  allowed_operation,
  policy_definition
FROM storage.policies 
WHERE bucket_id = 'brand-logos'
ORDER BY allowed_operation;

-- Resumen final
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'brand-logos' AND public = true)
    THEN '✅ BUCKET CONFIGURADO CORRECTAMENTE'
    ELSE '❌ ERROR: Bucket no existe o no es público'
  END as bucket_status,
  
  (SELECT COUNT(*) FROM storage.policies WHERE bucket_id = 'brand-logos') as total_policies,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM storage.policies WHERE bucket_id = 'brand-logos') >= 4
    THEN '✅ POLÍTICAS CONFIGURADAS' 
    ELSE '❌ FALTAN POLÍTICAS'
  END as policies_status;

-- Mostrar URL de ejemplo
SELECT 
  'URL EXAMPLE' as info,
  'https://supabase.lacasadelsueloradianteapp.com/storage/v1/object/public/brand-logos/example.jpg' as sample_url;