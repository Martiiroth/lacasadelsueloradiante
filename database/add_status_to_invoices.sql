-- Agregar columna status y otros campos faltantes a la tabla invoices
-- Este script migra la tabla existente para ser compatible con el código TypeScript

-- 1. Agregar columna status (obligatoria para el sistema)
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' 
CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled'));

-- 2. Agregar columna updated_at para tracking de cambios
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;

-- 3. Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_invoices_updated_at ON invoices;
CREATE TRIGGER trigger_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();

-- 4. Agregar restricción UNIQUE para evitar facturas duplicadas por pedido
ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS unique_order_invoice;

ALTER TABLE public.invoices 
ADD CONSTRAINT unique_order_invoice UNIQUE (order_id);

-- 5. Agregar checks de validación
ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_total_cents_check;

ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_total_cents_check CHECK (total_cents >= 0);

-- 6. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number DESC);

-- 7. Actualizar valores NULL existentes (si los hay)
UPDATE public.invoices 
SET status = 'pending' 
WHERE status IS NULL;

-- 8. Actualizar updated_at para registros existentes
UPDATE public.invoices 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- 9. Comentarios para documentación
COMMENT ON COLUMN invoices.status IS 'Estado de la factura: pending, paid, overdue, cancelled';
COMMENT ON COLUMN invoices.updated_at IS 'Última actualización de la factura';

-- 10. Verificar la estructura final
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'invoices'
ORDER BY ordinal_position;
