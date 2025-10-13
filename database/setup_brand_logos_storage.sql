-- Script para configurar Supabase Storage para logos de marcas
-- Ejecutar en Supabase SQL Editor

-- 1. Crear el bucket para logos de marcas (ejecutar desde la consola de Storage)
-- Ve a Storage > Create bucket
-- Nombre: brand-logos  
-- Público: SÍ
-- Límite de tamaño: 2MB
-- MIME types: image/jpeg,image/jpg,image/png,image/gif,image/webp

-- 2. Configurar políticas RLS para el bucket brand-logos

-- Política para lectura pública (cualquiera puede ver los logos)
INSERT INTO storage.policies (name, bucket_id, policy_definition, allowed_operation, target)
VALUES (
  'Public Access for Brand Logos',
  'brand-logos',
  'true',
  'SELECT',
  'object'
);

-- Política para subida de archivos (usuarios autenticados)
INSERT INTO storage.policies (name, bucket_id, policy_definition, allowed_operation, target)
VALUES (
  'Authenticated users can upload brand logos',
  'brand-logos', 
  'auth.role() = ''authenticated''',
  'INSERT',
  'object'
);

-- Política para actualización de archivos (usuarios autenticados)
INSERT INTO storage.policies (name, bucket_id, policy_definition, allowed_operation, target)
VALUES (
  'Authenticated users can update brand logos',
  'brand-logos',
  'auth.role() = ''authenticated''',
  'UPDATE', 
  'object'
);

-- Política para eliminación de archivos (usuarios autenticados)
INSERT INTO storage.policies (name, bucket_id, policy_definition, allowed_operation, target)
VALUES (
  'Authenticated users can delete brand logos',
  'brand-logos',
  'auth.role() = ''authenticated''',
  'DELETE',
  'object'
);

-- 3. Verificar que las políticas se crearon correctamente
SELECT 
  name,
  bucket_id,
  policy_definition,
  allowed_operation,
  target
FROM storage.policies 
WHERE bucket_id = 'brand-logos';

-- 4. Verificar que el bucket existe
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets 
WHERE name = 'brand-logos';