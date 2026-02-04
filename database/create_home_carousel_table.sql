-- Tabla para productos destacados del carrusel de la homepage
-- Permite elegir qué productos aparecen y en qué orden
CREATE TABLE IF NOT EXISTS home_carousel_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id)
);

CREATE INDEX IF NOT EXISTS idx_home_carousel_products_position ON home_carousel_products(position);

COMMENT ON TABLE home_carousel_products IS 'Productos mostrados en el carrusel de la página principal, ordenados por position';

-- RLS: lectura pública para el carrusel, escritura solo con service_role o admin
ALTER TABLE home_carousel_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view carousel products"
  ON home_carousel_products
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage carousel"
  ON home_carousel_products
  FOR ALL
  USING (auth.role() = 'service_role');
