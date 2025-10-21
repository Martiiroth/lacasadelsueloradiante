-- Crear tabla de contadores de facturas
-- Este script crea la tabla invoice_counters para gestionar la numeración secuencial

-- Eliminar tabla si existe (solo para desarrollo)
-- DROP TABLE IF EXISTS invoice_counters CASCADE;

-- Crear tabla invoice_counters
CREATE TABLE IF NOT EXISTS invoice_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefix TEXT NOT NULL DEFAULT 'FAC-',
  suffix TEXT NOT NULL DEFAULT '',
  next_number INTEGER NOT NULL DEFAULT 1 CHECK (next_number > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Índice único para la combinación prefix + suffix
  CONSTRAINT unique_prefix_suffix UNIQUE (prefix, suffix)
);

-- Crear índice para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_invoice_counters_prefix_suffix ON invoice_counters(prefix, suffix);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_invoice_counters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invoice_counters_updated_at
  BEFORE UPDATE ON invoice_counters
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_counters_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE invoice_counters ENABLE ROW LEVEL SECURITY;

-- Política: Solo administradores pueden ver contadores
CREATE POLICY "Only admins can view invoice counters"
  ON invoice_counters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = auth.uid()
      AND clients.role = 'admin'
    )
  );

-- Política: Solo administradores pueden insertar contadores
CREATE POLICY "Only admins can insert invoice counters"
  ON invoice_counters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = auth.uid()
      AND clients.role = 'admin'
    )
  );

-- Política: Solo administradores pueden actualizar contadores
CREATE POLICY "Only admins can update invoice counters"
  ON invoice_counters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = auth.uid()
      AND clients.role = 'admin'
    )
  );

-- Insertar contador por defecto si no existe
INSERT INTO invoice_counters (prefix, suffix, next_number)
VALUES ('FAC-', '', 1)
ON CONFLICT (prefix, suffix) DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE invoice_counters IS 'Tabla de contadores para generar números secuenciales de facturas';
COMMENT ON COLUMN invoice_counters.prefix IS 'Prefijo de la factura (ej: FAC-)';
COMMENT ON COLUMN invoice_counters.suffix IS 'Sufijo de la factura (opcional)';
COMMENT ON COLUMN invoice_counters.next_number IS 'Siguiente número a asignar';
