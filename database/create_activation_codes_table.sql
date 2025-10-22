-- Tabla de códigos de activación para app móvil
CREATE TABLE IF NOT EXISTS activation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(12) NOT NULL UNIQUE, -- Código de activación (ej: ABC-123-XYZ)
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  activated_at TIMESTAMP WITH TIME ZONE,
  last_validated_at TIMESTAMP WITH TIME ZONE,
  device_id VARCHAR(255), -- Identificador del dispositivo que activó el código
  metadata JSONB DEFAULT '{}'::jsonb -- Información adicional (versión app, etc)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_activation_codes_code ON activation_codes(code);
CREATE INDEX IF NOT EXISTS idx_activation_codes_order_id ON activation_codes(order_id);
CREATE INDEX IF NOT EXISTS idx_activation_codes_client_id ON activation_codes(client_id);
CREATE INDEX IF NOT EXISTS idx_activation_codes_status ON activation_codes(status);
CREATE INDEX IF NOT EXISTS idx_activation_codes_expires_at ON activation_codes(expires_at);

-- Función para generar código aleatorio de 12 caracteres (formato: XXXX-XXXX-XXXX)
CREATE OR REPLACE FUNCTION generate_activation_code()
RETURNS VARCHAR(14) AS $$
DECLARE
  chars VARCHAR := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Sin caracteres ambiguos (0,O,1,I)
  result VARCHAR := '';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, (random() * length(chars))::integer + 1, 1);
    IF i % 4 = 0 AND i < 12 THEN
      result := result || '-';
    END IF;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si un código es válido
CREATE OR REPLACE FUNCTION is_code_valid(code_to_check VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  code_record RECORD;
BEGIN
  SELECT * INTO code_record
  FROM activation_codes
  WHERE code = code_to_check;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  IF code_record.status != 'active' THEN
    RETURN FALSE;
  END IF;
  
  IF code_record.expires_at < NOW() THEN
    -- Actualizar estado a expirado
    UPDATE activation_codes
    SET status = 'expired'
    WHERE code = code_to_check;
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) policies
ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Los clientes solo pueden ver sus propios códigos
CREATE POLICY "Users can view their own activation codes"
  ON activation_codes
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth_uid FROM clients WHERE id = activation_codes.client_id
    )
  );

-- Policy: Solo service_role puede insertar códigos (desde backend)
CREATE POLICY "Service role can insert activation codes"
  ON activation_codes
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Policy: Solo service_role puede actualizar códigos
CREATE POLICY "Service role can update activation codes"
  ON activation_codes
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Comentarios para documentación
COMMENT ON TABLE activation_codes IS 'Códigos de activación premium para app móvil';
COMMENT ON COLUMN activation_codes.code IS 'Código de activación formato XXXX-XXXX-XXXX';
COMMENT ON COLUMN activation_codes.expires_at IS 'Fecha de expiración (30 días desde creación)';
COMMENT ON COLUMN activation_codes.device_id IS 'ID del dispositivo que activó el código';
COMMENT ON COLUMN activation_codes.status IS 'Estado: active, expired, revoked';
