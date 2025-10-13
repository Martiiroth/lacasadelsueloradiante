-- ===================================
-- CONFIGURACIÓN STORAGE BRAND-LOGOS - MÉTODO SUPABASE SEGURO
-- Sin modificar directamente storage.objects (evita error de permisos)
-- ===================================

-- PASO 1: Verificar bucket existente
SELECT 
  'ESTADO ACTUAL DEL BUCKET' as info,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'brand-logos';

-- PASO 2: Crear bucket si no existe (método seguro)
INSERT INTO storage.buckets (
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types
) 
SELECT 
  'brand-logos',
  'brand-logos', 
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE name = 'brand-logos'
);

-- PASO 3: Actualizar configuración del bucket (hacer público)
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
WHERE name = 'brand-logos';

-- VERIFICACIÓN FINAL
SELECT 
  'RESULTADO' as tipo,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM storage.buckets 
      WHERE name = 'brand-logos' AND public = true
    )
    THEN '✅ BUCKET CONFIGURADO CORRECTAMENTE'
    ELSE '❌ ERROR EN CONFIGURACIÓN'
  END as estado,
  
  'El bucket está público. No necesita RLS policies adicionales.' as nota;

-- Mostrar configuración final
SELECT 
  'CONFIGURACIÓN FINAL' as info,
  name as bucket_name,
  public as es_publico,
  file_size_limit/1024/1024 || ' MB' as limite_tamaño,
  array_length(allowed_mime_types, 1) as tipos_mime_permitidos
FROM storage.buckets 
WHERE name = 'brand-logos';

-- URL de prueba
SELECT 
  'EJEMPLO DE URL' as tipo,
  'https://tu-proyecto.supabase.co/storage/v1/object/public/brand-logos/test.jpg' as url_ejemplo,
  'Reemplaza "tu-proyecto" por tu URL real de Supabase' as instrucciones;