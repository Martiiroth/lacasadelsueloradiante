-- ============================================
-- POLÍTICAS DE SEGURIDAD PARA SUPABASE STORAGE
-- Bucket: product-images
-- ============================================

-- IMPORTANTE: Ejecuta estos comandos en el SQL Editor de Supabase
-- Dashboard > SQL Editor > New Query > Pega y ejecuta

-- ============================================
-- 1. ELIMINAR POLÍTICAS EXISTENTES (si hay conflictos)
-- ============================================

-- Descomenta estas líneas si necesitas resetear las políticas
-- DROP POLICY IF EXISTS "Public Access" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

-- ============================================
-- 2. POLÍTICA DE LECTURA PÚBLICA
-- Permite que CUALQUIERA pueda ver/descargar las imágenes
-- ============================================

CREATE POLICY "Public Access to product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- ============================================
-- 3. POLÍTICA DE SUBIDA (UPLOAD) - Solo usuarios autenticados
-- Permite que usuarios logueados suban imágenes
-- ============================================

CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- ============================================
-- 4. POLÍTICA DE ACTUALIZACIÓN - Solo usuarios autenticados
-- Permite que usuarios logueados actualicen imágenes
-- ============================================

CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- ============================================
-- 5. POLÍTICA DE ELIMINACIÓN - Solo usuarios autenticados
-- Permite que usuarios logueados eliminen imágenes
-- ============================================

CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- ============================================
-- 6. VERIFICAR QUE LAS POLÍTICAS SE CREARON
-- ============================================

-- Ejecuta esta consulta para verificar las políticas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%product%';

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================

-- 1. La política de lectura (SELECT) debe estar ACTIVA para que las imágenes
--    sean visibles públicamente en la web.

-- 2. Las políticas de INSERT, UPDATE, DELETE solo permiten operaciones
--    a usuarios autenticados (logueados).

-- 3. Si necesitas permitir uploads anónimos (sin login), cambia:
--    auth.role() = 'authenticated' 
--    por: 
--    auth.role() = 'anon' OR auth.role() = 'authenticated'

-- 4. Siempre verifica que el bucket 'product-images' exista antes de
--    ejecutar estas políticas.

-- 5. Para más seguridad, puedes agregar validaciones adicionales:
--    - Tamaño de archivo
--    - Tipo MIME permitido
--    - Límite de uploads por usuario
--    - etc.

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- Si las imágenes NO se ven en la web:
-- 1. Verifica que la política de SELECT esté activa
-- 2. Verifica que el bucket sea público
-- 3. Verifica las URLs en el navegador (deben ser accesibles)

-- Si NO puedes subir imágenes:
-- 1. Verifica que estés autenticado
-- 2. Verifica que la política de INSERT esté activa
-- 3. Revisa los logs de error en el navegador (Console)

-- ============================================
