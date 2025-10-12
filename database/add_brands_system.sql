-- Crear tabla de marcas
CREATE TABLE public.brands (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    description text,
    logo_url text,
    website text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT brands_pkey PRIMARY KEY (id)
);

-- Agregar campo brand_id a la tabla products
ALTER TABLE public.products 
ADD COLUMN brand_id uuid,
ADD CONSTRAINT products_brand_id_fkey 
    FOREIGN KEY (brand_id) REFERENCES public.brands(id);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_products_brand_id ON public.products(brand_id);
CREATE INDEX idx_brands_slug ON public.brands(slug);
CREATE INDEX idx_brands_is_active ON public.brands(is_active);

-- Insertar algunas marcas de ejemplo para suelo radiante
INSERT INTO public.brands (name, slug, description, logo_url, website, is_active) VALUES
('Rehau', 'rehau', 'Líder mundial en sistemas de tuberías para suelo radiante y climatización', '/images/brands/rehau-logo.png', 'https://www.rehau.com', true),
('Uponor', 'uponor', 'Especialista en soluciones de fontanería y climatización residencial', '/images/brands/uponor-logo.png', 'https://www.uponor.com', true),
('Giacomini', 'giacomini', 'Fabricante italiano de componentes para sistemas de calefacción', '/images/brands/giacomini-logo.png', 'https://www.giacomini.com', true),
('Watts', 'watts', 'Innovación en control de temperatura y sistemas hidránicos', '/images/brands/watts-logo.png', 'https://www.watts.com', true),
('Danfoss', 'danfoss', 'Tecnología avanzada para climatización y control de temperatura', '/images/brands/danfoss-logo.png', 'https://www.danfoss.com', true),
('Caleffi', 'caleffi', 'Componentes hidronicós para sistemas de calefacción y refrigeración', '/images/brands/caleffi-logo.png', 'https://www.caleffi.com', true),
('Viega', 'viega', 'Sistemas de instalación para fontanería y calefacción', '/images/brands/viega-logo.png', 'https://www.viega.com', true),
('Grundfos', 'grundfos', 'Bombas y sistemas de bombeo para aplicaciones de calefacción', '/images/brands/grundfos-logo.png', 'https://www.grundfos.com', true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at en brands
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();