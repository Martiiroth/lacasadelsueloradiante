-- ===================================
-- CONFIGURACIÓN COMPLETA DE STORAGE - MÉTODO ALTERNATIVO
-- Para cuando storage.policies no existe
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

-- PASO 2: Si el bucket no existe, crearlo
DO $$
BEGIN
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
    RAISE NOTICE 'Bucket brand-logos creado';
  ELSE
    RAISE NOTICE 'Bucket brand-logos ya existe';
  END IF;
END $$;

-- PASO 3: Asegurar que el bucket es público
UPDATE storage.buckets 
SET public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
WHERE name = 'brand-logos';

-- PASO 4: Habilitar RLS en la tabla objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- PASO 5: Limpiar políticas existentes
DROP POLICY IF EXISTS "Public Access for brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete brand logos" ON storage.objects;

-- PASO 6: Crear políticas RLS en storage.objects

-- Política 1: Lectura pública (CRÍTICA)
CREATE POLICY "Public Access for brand logos" ON storage.objects
FOR SELECT 
USING (bucket_id = 'brand-logos');

-- Política 2: Subida autenticada
CREATE POLICY "Authenticated users can upload brand logos" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'brand-logos' 
  AND auth.role() = 'authenticated'
);

-- Política 3: Actualización autenticada
CREATE POLICY "Authenticated users can update brand logos" ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'brand-logos' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'brand-logos' 
  AND auth.role() = 'authenticated'
);

-- Política 4: Eliminación autenticada
CREATE POLICY "Authenticated users can delete brand logos" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'brand-logos' 
  AND auth.role() = 'authenticated'
);

-- VERIFICACIÓN FINAL
SELECT 'VERIFICACIÓN COMPLETA' as step;

-- Verificar bucket
SELECT 
  'BUCKET FINAL' as check_type,
  name,
  public as is_public,
  file_size_limit,
  array_length(allowed_mime_types, 1) as mime_types_count,
  created_at
FROM storage.buckets 
WHERE name = 'brand-logos';

-- Verificar políticas RLS
SELECT 
  'POLICIES ON storage.objects' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%brand%';

-- Verificar RLS habilitado
SELECT 
  'RLS STATUS' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- Resumen de éxito
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'brand-logos' AND public = true)
    THEN '✅ BUCKET OK'
    ELSE '❌ BUCKET ERROR'
  END as bucket_status,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Public Access for brand logos'
    )
    THEN '✅ POLÍTICAS OK'
    ELSE '❌ POLÍTICAS ERROR'
  END as policies_status,
  
  'Storage configurado - prueba subir imagen' as next_step;

-- URL de ejemplo
SELECT 
  'URL EXAMPLE' as info,
  'https://supabase.lacasadelsueloradianteapp.com/storage/v1/object/public/brand-logos/logo.jpg' as sample_url;