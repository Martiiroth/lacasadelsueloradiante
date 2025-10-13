-- ===================================
-- CONFIGURACIÓN DE POLÍTICAS RLS PARA BUCKET brand-logos
-- Este script asume que el bucket ya existe
-- ===================================

-- PASO 1: Verificar que el bucket existe
SELECT 
  'BUCKET STATUS' as check_type,
  id,
  name,
  public,
  created_at,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'brand-logos';

-- Si el bucket no aparece arriba, detener aquí y crear el bucket manualmente desde Dashboard

-- PASO 2: Limpiar políticas existentes (por si hay conflictos)
DELETE FROM storage.policies WHERE bucket_id = 'brand-logos';

-- PASO 3: Asegurar que el bucket es público
UPDATE storage.buckets 
SET public = true 
WHERE name = 'brand-logos';

-- PASO 4: Crear políticas RLS necesarias

-- Política 1: Lectura pública (CRÍTICA - permite que cualquiera vea las imágenes)
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

-- Política 2: Subida autenticada (permite subir archivos a usuarios autenticados)
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

-- VERIFICACIÓN FINAL
SELECT 'VERIFICACIÓN DESPUÉS DE CONFIGURACIÓN' as step;

-- Mostrar bucket configurado
SELECT 
  'BUCKET FINAL' as check_type,
  name,
  public as is_public,
  file_size_limit,
  array_length(allowed_mime_types, 1) as mime_types_count,
  created_at
FROM storage.buckets 
WHERE name = 'brand-logos';

-- Mostrar políticas creadas
SELECT 
  'POLICIES CREATED' as check_type,
  name,
  allowed_operation,
  policy_definition,
  created_at
FROM storage.policies 
WHERE bucket_id = 'brand-logos'
ORDER BY allowed_operation;

-- Resumen de éxito
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'brand-logos' AND public = true)
    THEN '✅ BUCKET CONFIGURADO Y PÚBLICO'
    ELSE '❌ ERROR: Bucket no público o no existe'
  END as bucket_status,
  
  (SELECT COUNT(*) FROM storage.policies WHERE bucket_id = 'brand-logos') as total_policies,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM storage.policies WHERE bucket_id = 'brand-logos') >= 4
    THEN '✅ TODAS LAS POLÍTICAS CREADAS' 
    ELSE '❌ FALTAN POLÍTICAS'
  END as policies_status,

  'Ahora prueba subir una imagen desde el admin panel' as next_step;

-- Mostrar ejemplo de URL que se generará
SELECT 
  'URL EXAMPLE' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'brand-logos')
    THEN 'https://supabase.lacasadelsueloradianteapp.com/storage/v1/object/public/brand-logos/your-logo.jpg'
    ELSE 'Bucket not configured'
  END as sample_url;