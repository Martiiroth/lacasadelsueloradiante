-- Script para añadir campos necesarios para la integración de Redsys
-- Fecha: 2025-10-07

-- =====================================================
-- 1. AÑADIR CAMPOS FALTANTES A LA TABLA ORDERS
-- =====================================================

-- Campo para el email de invitados (checkout sin cuenta)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS guest_email TEXT;

-- Campo para el estado del pago
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Constraint para payment_status (sin IF NOT EXISTS porque no está soportado)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'orders_payment_status_check'
    ) THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_payment_status_check 
        CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled'));
    END IF;
END $$;

-- Campo para dirección de facturación (almacenada como JSON)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS billing_address JSONB;

-- Campo para método de envío seleccionado
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_method_id UUID;

-- Foreign key para shipping_method_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'orders_shipping_method_id_fkey'
    ) THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_shipping_method_id_fkey 
        FOREIGN KEY (shipping_method_id) REFERENCES public.shipping_methods(id);
    END IF;
END $$;

-- Campo para método de pago seleccionado
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method_id UUID;

-- Foreign key para payment_method_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'orders_payment_method_id_fkey'
    ) THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_payment_method_id_fkey 
        FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id);
    END IF;
END $$;

-- Campo para código de cupón usado
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- Campo para descuento aplicado (en céntimos)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS discount_cents INTEGER DEFAULT 0;

-- Campo para coste de envío (en céntimos)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_cost_cents INTEGER DEFAULT 0;

-- Campo para subtotal (antes de envío y descuentos)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS subtotal_cents INTEGER;

-- Campo para número de confirmación
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS confirmation_number TEXT;

-- Índice único para confirmation_number
CREATE UNIQUE INDEX IF NOT EXISTS orders_confirmation_number_idx 
ON public.orders(confirmation_number) 
WHERE confirmation_number IS NOT NULL;

-- =====================================================
-- 2. ACTUALIZAR CONSTRAINT DE STATUS EN ORDERS
-- =====================================================

-- Eliminar constraint anterior si existe
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

-- Añadir constraint actualizado con más estados
ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'));

-- =====================================================
-- 3. AÑADIR COLUMNAS ADICIONALES A ORDER_LOGS
-- =====================================================

-- Campo para el estado en los logs
ALTER TABLE public.order_logs 
ADD COLUMN IF NOT EXISTS status TEXT;

-- Campo para comentario descriptivo
ALTER TABLE public.order_logs 
ADD COLUMN IF NOT EXISTS comment TEXT;

-- Renombrar columna 'action' a 'event_type' si prefieres más claridad (opcional)
-- ALTER TABLE public.order_logs RENAME COLUMN action TO event_type;

-- =====================================================
-- 4. CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================

-- Índice para búsqueda por email de invitado
CREATE INDEX IF NOT EXISTS orders_guest_email_idx 
ON public.orders(guest_email) 
WHERE guest_email IS NOT NULL;

-- Índice para búsqueda por estado de pago
CREATE INDEX IF NOT EXISTS orders_payment_status_idx 
ON public.orders(payment_status);

-- Índice compuesto para búsqueda por cliente y estado
CREATE INDEX IF NOT EXISTS orders_client_status_idx 
ON public.orders(client_id, status);

-- Índice para búsqueda por fecha de creación
CREATE INDEX IF NOT EXISTS orders_created_at_idx 
ON public.orders(created_at DESC);

-- =====================================================
-- 5. AÑADIR COMENTARIOS A LAS COLUMNAS
-- =====================================================

COMMENT ON COLUMN public.orders.guest_email IS 'Email del comprador cuando realiza checkout sin crear cuenta';
COMMENT ON COLUMN public.orders.payment_status IS 'Estado del pago: pending, paid, failed, refunded, cancelled';
COMMENT ON COLUMN public.orders.billing_address IS 'Dirección de facturación en formato JSON';
COMMENT ON COLUMN public.orders.shipping_address IS 'Dirección de envío en formato JSON';
COMMENT ON COLUMN public.orders.shipping_method_id IS 'Método de envío seleccionado';
COMMENT ON COLUMN public.orders.payment_method_id IS 'Método de pago seleccionado (ej: Redsys, PayPal)';
COMMENT ON COLUMN public.orders.coupon_code IS 'Código de cupón aplicado al pedido';
COMMENT ON COLUMN public.orders.discount_cents IS 'Descuento total aplicado en céntimos';
COMMENT ON COLUMN public.orders.shipping_cost_cents IS 'Coste de envío en céntimos';
COMMENT ON COLUMN public.orders.subtotal_cents IS 'Subtotal antes de envío y descuentos en céntimos';
COMMENT ON COLUMN public.orders.confirmation_number IS 'Número de confirmación único del pedido';

-- =====================================================
-- 6. CREAR TABLA PARA TRANSACCIONES DE PAGO (OPCIONAL)
-- =====================================================

-- Tabla para registrar transacciones de pago con Redsys
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id),
    payment_method_id UUID REFERENCES public.payment_methods(id),
    
    -- Datos de Redsys
    transaction_id TEXT, -- DS_ORDER de Redsys
    authorization_code TEXT, -- DS_AUTHORISATIONCODE
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'EUR',
    
    -- Estado de la transacción
    status TEXT NOT NULL DEFAULT 'pending',
    response_code TEXT, -- Código de respuesta de Redsys
    response_message TEXT,
    
    -- Datos adicionales de Redsys
    card_type TEXT, -- DS_CARD_TYPE
    card_country TEXT, -- DS_CARD_COUNTRY
    secure_payment TEXT, -- DS_SECUREPAYMENT
    
    -- Metadatos
    raw_response JSONB, -- Respuesta completa de Redsys
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT payment_transactions_status_check 
    CHECK (status IN ('pending', 'authorized', 'completed', 'failed', 'cancelled', 'refunded'))
);

-- Índices para payment_transactions
CREATE INDEX IF NOT EXISTS payment_transactions_order_id_idx 
ON public.payment_transactions(order_id);

CREATE INDEX IF NOT EXISTS payment_transactions_transaction_id_idx 
ON public.payment_transactions(transaction_id);

CREATE INDEX IF NOT EXISTS payment_transactions_status_idx 
ON public.payment_transactions(status);

-- Comentarios para payment_transactions
COMMENT ON TABLE public.payment_transactions IS 'Registro de transacciones de pago con pasarelas externas (Redsys, PayPal, etc.)';
COMMENT ON COLUMN public.payment_transactions.transaction_id IS 'ID de transacción en la pasarela de pago (DS_ORDER en Redsys)';
COMMENT ON COLUMN public.payment_transactions.authorization_code IS 'Código de autorización de la transacción';
COMMENT ON COLUMN public.payment_transactions.raw_response IS 'Respuesta completa de la pasarela de pago en formato JSON';

-- =====================================================
-- 7. VERIFICACIÓN FINAL
-- =====================================================

-- Mostrar la estructura actualizada de la tabla orders
DO $$
BEGIN
    RAISE NOTICE '✅ Migración completada exitosamente';
    RAISE NOTICE '📋 Campos añadidos a la tabla orders:';
    RAISE NOTICE '   - guest_email';
    RAISE NOTICE '   - payment_status';
    RAISE NOTICE '   - billing_address';
    RAISE NOTICE '   - shipping_method_id';
    RAISE NOTICE '   - payment_method_id';
    RAISE NOTICE '   - coupon_code';
    RAISE NOTICE '   - discount_cents';
    RAISE NOTICE '   - shipping_cost_cents';
    RAISE NOTICE '   - subtotal_cents';
    RAISE NOTICE '   - confirmation_number';
    RAISE NOTICE '📊 Tabla payment_transactions creada';
    RAISE NOTICE '🔍 Índices creados para optimización';
END $$;
