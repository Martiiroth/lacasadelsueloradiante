-- Script de prueba para insertar una marca de prueba
-- Ejecutar DESPUÉS de haber ejecutado add_brands_system.sql

-- Insertar una marca de prueba si no existe
INSERT INTO public.brands (name, slug, logo_url, is_active)
VALUES ('Marca Test', 'marca-test', 'https://via.placeholder.com/150x150/4F46E5/FFFFFF?text=TEST', true)
ON CONFLICT (slug) DO NOTHING;

-- Verificar que se insertó
SELECT * FROM public.brands WHERE slug = 'marca-test';

-- Ver todas las marcas activas
SELECT id, name, slug, logo_url, is_active 
FROM public.brands 
WHERE is_active = true 
ORDER BY name;