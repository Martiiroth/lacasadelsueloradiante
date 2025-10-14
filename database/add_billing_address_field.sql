-- Agregar campo billing_address a la tabla orders
-- Este campo guardará los datos del cliente no registrado

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS billing_address JSONB;

-- Crear índice para optimizar búsquedas por email de invitados
CREATE INDEX IF NOT EXISTS idx_orders_billing_address_email 
ON public.orders USING gin ((billing_address->'email'));

-- Comentario descriptivo
COMMENT ON COLUMN public.orders.billing_address IS 'Datos de facturación del cliente (especialmente para clientes no registrados). Formato: {first_name, last_name, email, phone, address_line1, city, etc.}';

-- Verificar que el cambio se aplicó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'billing_address';