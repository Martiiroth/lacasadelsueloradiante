-- ===================================
-- SOLUCIÓN FINAL STORAGE - Configurar RLS para brand-logos
-- ===================================

-- ⚠️ EJECUTA ESTO EN EL SQL EDITOR DE SUPABASE ⚠️

-- Verificar que el bucket existe
SELECT name, public FROM storage.buckets WHERE name = 'brand-logos';

-- Habilitar RLS en storage.objects (ya debería estar habilitado)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes por si acaso
DROP POLICY IF EXISTS "Todos pueden ver brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir brand logos" ON storage.objects;

-- POLÍTICA CLAVE: Permitir lectura pública
CREATE POLICY "Todos pueden ver brand logos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'brand-logos');

-- POLÍTICA CLAVE: Permitir subida autenticada
CREATE POLICY "Usuarios autenticados pueden subir brand logos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'brand-logos' AND auth.role() = 'authenticated');

-- Verificar que las políticas se crearon
SELECT policyname, cmd FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%brand%';

-- Mensaje de éxito
SELECT '✅ CONFIGURACIÓN COMPLETA - Ahora puedes subir imágenes!' as resultado;