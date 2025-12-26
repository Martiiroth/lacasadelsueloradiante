-- Agregar campos para productos personalizados en order_items
-- Esto permite guardar productos que no existen en el catálogo

ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS product_title TEXT,
ADD COLUMN IF NOT EXISTS variant_title TEXT;

-- Comentarios para documentar
COMMENT ON COLUMN public.order_items.product_title IS 'Nombre del producto cuando es personalizado (no existe en catálogo)';
COMMENT ON COLUMN public.order_items.variant_title IS 'Nombre de la variante cuando es personalizado (no existe en catálogo)';

