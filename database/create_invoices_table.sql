-- Crear tabla de facturas
-- Este script crea la tabla invoices con todas las columnas necesarias

-- Eliminar tabla si existe (solo para desarrollo)
-- DROP TABLE IF EXISTS invoices CASCADE;

-- Crear tabla invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Numeración de factura
  invoice_number INTEGER NOT NULL,
  prefix TEXT NOT NULL DEFAULT 'FAC-',
  suffix TEXT NOT NULL DEFAULT '',
  
  -- Datos financieros
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Estado de la factura
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  
  -- Fechas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Índice único para evitar duplicados por pedido
  CONSTRAINT unique_order_invoice UNIQUE (order_id)
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number DESC);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Política: Los administradores pueden ver todas las facturas
CREATE POLICY "Admins can view all invoices"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = auth.uid()
      AND clients.role = 'admin'
    )
  );

-- Política: Los clientes solo pueden ver sus propias facturas
CREATE POLICY "Clients can view their own invoices"
  ON invoices FOR SELECT
  USING (client_id = auth.uid());

-- Política: Solo los administradores pueden insertar facturas
CREATE POLICY "Only admins can insert invoices"
  ON invoices FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = auth.uid()
      AND clients.role = 'admin'
    )
  );

-- Política: Solo los administradores pueden actualizar facturas
CREATE POLICY "Only admins can update invoices"
  ON invoices FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = auth.uid()
      AND clients.role = 'admin'
    )
  );

-- Política: Solo los administradores pueden eliminar facturas
CREATE POLICY "Only admins can delete invoices"
  ON invoices FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = auth.uid()
      AND clients.role = 'admin'
    )
  );

-- Comentarios para documentación
COMMENT ON TABLE invoices IS 'Tabla de facturas generadas automáticamente al marcar pedidos como entregados';
COMMENT ON COLUMN invoices.invoice_number IS 'Número secuencial de factura (sin prefijo ni sufijo)';
COMMENT ON COLUMN invoices.prefix IS 'Prefijo de la factura (ej: FAC-)';
COMMENT ON COLUMN invoices.suffix IS 'Sufijo de la factura (opcional)';
COMMENT ON COLUMN invoices.total_cents IS 'Total de la factura en céntimos';
COMMENT ON COLUMN invoices.status IS 'Estado: pending, paid, overdue, cancelled';
COMMENT ON COLUMN invoices.due_date IS 'Fecha de vencimiento del pago';
