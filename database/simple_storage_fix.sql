-- ===================================
-- SOLUCIÓN SIMPLE PARA STORAGE
-- Ejecutar línea por línea si hay errores
-- ===================================

-- 1. Verificar bucket actual
SELECT name, public, created_at FROM storage.buckets WHERE name = 'brand-logos';

-- 2. Hacer el bucket público (CRÍTICO)
UPDATE storage.buckets SET public = true WHERE name = 'brand-logos';

-- 3. Configurar límites del bucket
UPDATE storage.buckets 
SET file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
WHERE name = 'brand-logos';

-- 4. Habilitar RLS en objects (si no está habilitado)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Crear política básica de lectura pública
CREATE POLICY IF NOT EXISTS "brand_logos_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'brand-logos');

-- 6. Crear política de subida para usuarios autenticados  
CREATE POLICY IF NOT EXISTS "brand_logos_auth_insert" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'brand-logos' AND auth.role() = 'authenticated');

-- 7. Verificación final
SELECT 
  'Bucket configurado:' as status,
  name,
  public,
  file_size_limit
FROM storage.buckets 
WHERE name = 'brand-logos';

-- 8. Verificar políticas
SELECT 
  'Políticas creadas:' as status,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (policyname LIKE '%brand%' OR qual LIKE '%brand-logos%');

-- Si todo está bien, deberías ver:
-- - Bucket público = true
-- - Al menos 2 políticas creadas