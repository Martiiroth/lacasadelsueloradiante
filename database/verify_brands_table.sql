-- Verificar si la tabla brands existe y tiene datos
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'brands';

-- Si la tabla existe, ver su estructura
\d public.brands;

-- Ver si hay datos en la tabla
SELECT COUNT(*) as total_brands FROM public.brands;

-- Ver las primeras marcas si existen
SELECT id, name, slug, logo_url, is_active 
FROM public.brands 
WHERE is_active = true 
LIMIT 5;

-- Ver todas las marcas (incluso inactivas)
SELECT id, name, slug, logo_url, is_active, created_at
FROM public.brands 
ORDER BY created_at DESC;