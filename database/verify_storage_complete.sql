-- Script de verificación completa del Storage
-- Ejecutar en Supabase SQL Editor para diagnosticar problemas

-- 1. Verificar si existen buckets
SELECT 
  id,
  name,
  public,
  created_at,
  updated_at,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets;

-- 2. Verificar si existe específicamente el bucket brand-logos
SELECT 
  id,
  name,
  public,
  created_at,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'brand-logos';

-- 3. Verificar políticas existentes
SELECT 
  id,
  name,
  bucket_id,
  policy_definition,
  allowed_operation,
  target,
  created_at
FROM storage.policies 
WHERE bucket_id = 'brand-logos';

-- 4. Si el bucket no existe, crearlo manualmente:
-- NOTA: Esto solo funciona si tienes permisos de administrador
-- Normalmente se debe crear desde el Dashboard

/*
-- Solo ejecutar si el bucket NO existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-logos',
  'brand-logos',
  true,
  2097152, -- 2MB en bytes
  '{image/jpeg,image/jpg,image/png,image/gif,image/webp}'
);
*/

-- 5. Crear las políticas si el bucket existe pero no tiene políticas

-- Política para lectura pública
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'brand-logos' AND allowed_operation = 'SELECT'
  ) THEN
    INSERT INTO storage.policies (name, bucket_id, policy_definition, allowed_operation, target)
    VALUES (
      'Public Access for Brand Logos',
      'brand-logos',
      'true',
      'SELECT',
      'object'
    );
  END IF;
END $$;

-- Política para subida autenticada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'brand-logos' AND allowed_operation = 'INSERT'
  ) THEN
    INSERT INTO storage.policies (name, bucket_id, policy_definition, allowed_operation, target)
    VALUES (
      'Authenticated users can upload brand logos',
      'brand-logos', 
      'auth.role() = ''authenticated''',
      'INSERT',
      'object'
    );
  END IF;
END $$;

-- Política para actualización autenticada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'brand-logos' AND allowed_operation = 'UPDATE'
  ) THEN
    INSERT INTO storage.policies (name, bucket_id, policy_definition, allowed_operation, target)
    VALUES (
      'Authenticated users can update brand logos',
      'brand-logos',
      'auth.role() = ''authenticated''',
      'UPDATE', 
      'object'
    );
  END IF;
END $$;

-- Política para eliminación autenticada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'brand-logos' AND allowed_operation = 'DELETE'
  ) THEN
    INSERT INTO storage.policies (name, bucket_id, policy_definition, allowed_operation, target)
    VALUES (
      'Authenticated users can delete brand logos',
      'brand-logos',
      'auth.role() = ''authenticated''',
      'DELETE',
      'object'
    );
  END IF;
END $$;

-- 6. Verificación final
SELECT 
  'Bucket exists' as status,
  CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'brand-logos') 
       THEN 'YES' 
       ELSE 'NO - CREATE BUCKET FIRST' 
  END as bucket_status,
  
  (SELECT count(*) FROM storage.policies WHERE bucket_id = 'brand-logos') as policies_count,
  
  CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'brand-logos' AND public = true) 
       THEN 'YES' 
       ELSE 'NO - BUCKET NOT PUBLIC' 
  END as is_public;