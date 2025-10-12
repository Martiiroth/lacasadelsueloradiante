-- Actualizar la política de lectura pública de productos para incluir información de marca
DROP POLICY IF EXISTS "Products are publicly readable" ON public.products;

CREATE POLICY "Products are publicly readable" 
ON public.products FOR SELECT 
USING (
    status = 'active' OR 
    status = 'published'
);

-- Nota: No es necesario cambiar otras políticas de productos ya que brand_id 
-- se agregará automáticamente cuando se actualicen los productos