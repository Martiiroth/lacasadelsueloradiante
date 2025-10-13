-- ===================================
-- CONFIGURACIÓN COMPLETA BUCKET BRAND-LOGOS CON SQL
-- Ejecutar en Supabase SQL Editor
-- ===================================

-- 1. VERIFICAR ESTADO ACTUAL
SELECT 
  'ESTADO ACTUAL' as info,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE name = 'brand-logos';

-- 2. CREAR BUCKET SI NO EXISTE (opcional - ya debería existir)
INSERT INTO storage.buckets (
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types,
  created_at,
  updated_at
) 
SELECT 
  'brand-logos',
  'brand-logos', 
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE name = 'brand-logos'
);

-- 3. ASEGURAR QUE EL BUCKET SEA PÚBLICO
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  updated_at = NOW()
WHERE name = 'brand-logos';

-- 4. VERIFICAR RLS ESTÁ HABILITADO
SELECT 
  'RLS STATUS' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- 5. LIMPIAR POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Public read brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Todos pueden ver brand logos" ON storage.objects;

-- 6. CREAR POLÍTICA DE LECTURA PÚBLICA
CREATE POLICY "Public read brand logos" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'brand-logos');

-- 7. CREAR POLÍTICA DE SUBIDA AUTENTICADA  
CREATE POLICY "Authenticated upload brand logos" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'brand-logos');

-- 8. CREAR POLÍTICA DE ACTUALIZACIÓN AUTENTICADA (opcional)
CREATE POLICY "Authenticated update brand logos" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'brand-logos')
WITH CHECK (bucket_id = 'brand-logos');

-- 9. CREAR POLÍTICA DE ELIMINACIÓN AUTENTICADA (opcional)
CREATE POLICY "Authenticated delete brand logos" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'brand-logos');

-- 10. VERIFICAR POLÍTICAS CREADAS
SELECT 
  'POLÍTICAS CREADAS' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname LIKE '%brand%'
ORDER BY policyname;

-- 11. VERIFICACIÓN FINAL
SELECT 
  'VERIFICACIÓN FINAL' as step,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM storage.buckets 
      WHERE name = 'brand-logos' AND public = true
    )
    THEN '✅ BUCKET PÚBLICO'
    ELSE '❌ BUCKET NO PÚBLICO'
  END as bucket_status,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Public read brand logos'
    )
    THEN '✅ LECTURA PÚBLICA'
    ELSE '❌ SIN LECTURA PÚBLICA'
  END as read_policy,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated upload brand logos'
    )
    THEN '✅ SUBIDA AUTENTICADA'
    ELSE '❌ SIN SUBIDA AUTENTICADA'
  END as upload_policy;

-- 12. URL DE EJEMPLO
SELECT 
  'URL EJEMPLO' as info,
  CONCAT(
    'https://supabase.lacasadelsueloradianteapp.com/storage/v1/object/public/brand-logos/',
    'test-image.jpg'
  ) as ejemplo_url_publica,
  'Las imágenes subidas serán accesibles públicamente con este formato' as nota;

-- 13. MENSAJE DE ÉXITO
SELECT '🎉 CONFIGURACIÓN COMPLETADA - BUCKET BRAND-LOGOS LISTO PARA USAR' as resultado;