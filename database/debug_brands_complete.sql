-- Script completo de diagnóstico para el sistema de marcas
-- Ejecutar en Supabase SQL Editor para verificar todo el sistema

-- 1. Verificar si existe la tabla brands
SELECT 
    table_name,
    table_type,
    is_insertable_into
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'brands';

-- 2. Verificar la estructura de la tabla si existe
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'brands'
ORDER BY ordinal_position;

-- 3. Contar registros en la tabla
SELECT COUNT(*) as total_brands FROM brands;

-- 4. Mostrar todas las marcas existentes
SELECT 
    id,
    name,
    logo_url,
    created_at,
    updated_at
FROM brands 
ORDER BY created_at DESC;

-- 5. Verificar políticas RLS
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
WHERE schemaname = 'public' 
    AND tablename = 'brands';

-- 6. Verificar productos con marcas
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.brand_id,
    b.name as brand_name,
    b.logo_url
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
WHERE p.brand_id IS NOT NULL
LIMIT 10;

-- Si la tabla no existe, crear el sistema completo:
-- (Descomenta las siguientes líneas si la tabla no existe)

/*
-- Crear tabla brands
CREATE TABLE IF NOT EXISTS brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columna brand_id a productos si no existe
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);

-- Crear índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);

-- Habilitar RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública
CREATE POLICY "Anyone can view brands" ON brands
    FOR SELECT USING (true);

-- Política para inserción (solo usuarios autenticados)
CREATE POLICY "Authenticated users can insert brands" ON brands
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para actualización (solo usuarios autenticados)
CREATE POLICY "Authenticated users can update brands" ON brands
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para eliminación (solo usuarios autenticados)
CREATE POLICY "Authenticated users can delete brands" ON brands
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insertar marcas de prueba
INSERT INTO brands (name, logo_url) VALUES 
('Nike', 'https://via.placeholder.com/100x50/007BFF/FFFFFF?text=Nike'),
('Adidas', 'https://via.placeholder.com/100x50/FF6B6B/FFFFFF?text=Adidas'),
('Apple', 'https://via.placeholder.com/100x50/28A745/FFFFFF?text=Apple'),
('Samsung', 'https://via.placeholder.com/100x50/FFC107/000000?text=Samsung')
ON CONFLICT (name) DO NOTHING;
*/