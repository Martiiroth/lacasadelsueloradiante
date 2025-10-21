-- Agregar campos de IVA a la tabla invoices
-- Este script agrega los campos necesarios para el desglose de IVA en facturas

-- 1. Agregar columna subtotal_cents (base imponible sin IVA)
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS subtotal_cents INTEGER;

-- 2. Agregar columna tax_rate (porcentaje de IVA, ej: 21 para 21%)
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) NOT NULL DEFAULT 21.00;

-- 3. Agregar columna tax_cents (importe del IVA)
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS tax_cents INTEGER;

-- 4. Actualizar facturas existentes con el cálculo del IVA
-- Asumiendo que el total_cents actual incluye IVA del 21%
UPDATE public.invoices 
SET 
  subtotal_cents = ROUND(total_cents / 1.21),
  tax_rate = 21.00,
  tax_cents = total_cents - ROUND(total_cents / 1.21)
WHERE subtotal_cents IS NULL OR tax_cents IS NULL;

-- 5. Hacer las columnas NOT NULL después de poblarlas
ALTER TABLE public.invoices 
ALTER COLUMN subtotal_cents SET NOT NULL;

ALTER TABLE public.invoices 
ALTER COLUMN tax_cents SET NOT NULL;

-- 6. Agregar checks de validación
ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_subtotal_cents_check;

ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_subtotal_cents_check CHECK (subtotal_cents >= 0);

ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_tax_cents_check;

ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_tax_cents_check CHECK (tax_cents >= 0);

ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_tax_rate_check;

ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_tax_rate_check CHECK (tax_rate >= 0 AND tax_rate <= 100);

-- 7. Agregar índice para búsquedas por tax_rate
CREATE INDEX IF NOT EXISTS idx_invoices_tax_rate ON invoices(tax_rate);

-- 8. Comentarios para documentación
COMMENT ON COLUMN invoices.subtotal_cents IS 'Base imponible sin IVA (en céntimos)';
COMMENT ON COLUMN invoices.tax_rate IS 'Porcentaje de IVA aplicado (ej: 21.00 para 21%)';
COMMENT ON COLUMN invoices.tax_cents IS 'Importe del IVA en céntimos';

-- 9. Verificar la estructura final
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'invoices'
  AND column_name IN ('subtotal_cents', 'tax_rate', 'tax_cents', 'total_cents')
ORDER BY ordinal_position;

-- 10. Verificar que los cálculos son correctos (debe dar 0 diferencias)
SELECT 
  id,
  invoice_number,
  subtotal_cents,
  tax_cents,
  total_cents,
  (subtotal_cents + tax_cents) as calculated_total,
  (total_cents - (subtotal_cents + tax_cents)) as difference
FROM public.invoices
WHERE (subtotal_cents + tax_cents) != total_cents
LIMIT 10;
