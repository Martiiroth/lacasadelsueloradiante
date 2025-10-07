-- Script para añadir soporte de estado de pago en la tabla orders
-- Ejecutar en Supabase SQL Editor

-- Verificar si la columna payment_status ya existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'payment_status'
    ) THEN
        -- Añadir columna payment_status si no existe
        ALTER TABLE orders 
        ADD COLUMN payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
        
        RAISE NOTICE 'Columna payment_status añadida a la tabla orders';
    ELSE
        RAISE NOTICE 'La columna payment_status ya existe en la tabla orders';
    END IF;
END $$;

-- Crear índice para mejorar consultas por payment_status
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Actualizar órdenes existentes confirmadas como pagadas
UPDATE orders 
SET payment_status = 'paid' 
WHERE status IN ('confirmed', 'processing', 'shipped', 'delivered') 
AND payment_status = 'pending';

-- Actualizar órdenes canceladas como fallidas
UPDATE orders 
SET payment_status = 'failed' 
WHERE status = 'cancelled' 
AND payment_status = 'pending';

-- Comentario de la columna
COMMENT ON COLUMN orders.payment_status IS 'Estado del pago: pending (pendiente), paid (pagado), failed (fallido), refunded (reembolsado)';

-- Verificar la estructura actualizada
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name = 'payment_status';
