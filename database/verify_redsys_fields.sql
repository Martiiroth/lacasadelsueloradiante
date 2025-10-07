-- Script de verificación de campos para Redsys
-- Ejecuta este script para verificar si tu base de datos está lista

-- =====================================================
-- VERIFICAR CAMPOS EN TABLA ORDERS
-- =====================================================
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    col_exists BOOLEAN;
BEGIN
    RAISE NOTICE '🔍 Verificando tabla orders...';
    
    -- Verificar cada campo necesario
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'guest_email'
    ) INTO col_exists;
    IF NOT col_exists THEN missing_columns := array_append(missing_columns, 'guest_email'); END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'payment_status'
    ) INTO col_exists;
    IF NOT col_exists THEN missing_columns := array_append(missing_columns, 'payment_status'); END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'billing_address'
    ) INTO col_exists;
    IF NOT col_exists THEN missing_columns := array_append(missing_columns, 'billing_address'); END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'shipping_method_id'
    ) INTO col_exists;
    IF NOT col_exists THEN missing_columns := array_append(missing_columns, 'shipping_method_id'); END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'payment_method_id'
    ) INTO col_exists;
    IF NOT col_exists THEN missing_columns := array_append(missing_columns, 'payment_method_id'); END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'coupon_code'
    ) INTO col_exists;
    IF NOT col_exists THEN missing_columns := array_append(missing_columns, 'coupon_code'); END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'discount_cents'
    ) INTO col_exists;
    IF NOT col_exists THEN missing_columns := array_append(missing_columns, 'discount_cents'); END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'shipping_cost_cents'
    ) INTO col_exists;
    IF NOT col_exists THEN missing_columns := array_append(missing_columns, 'shipping_cost_cents'); END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'subtotal_cents'
    ) INTO col_exists;
    IF NOT col_exists THEN missing_columns := array_append(missing_columns, 'subtotal_cents'); END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'confirmation_number'
    ) INTO col_exists;
    IF NOT col_exists THEN missing_columns := array_append(missing_columns, 'confirmation_number'); END IF;
    
    -- Mostrar resultado
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '❌ FALTAN CAMPOS EN ORDERS:';
        FOR i IN 1..array_length(missing_columns, 1) LOOP
            RAISE NOTICE '   - %', missing_columns[i];
        END LOOP;
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  Ejecuta el script: database/add_redsys_fields.sql';
    ELSE
        RAISE NOTICE '✅ Todos los campos necesarios existen en orders';
    END IF;
END $$;

-- =====================================================
-- VERIFICAR CAMPOS EN TABLA ORDER_LOGS
-- =====================================================
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    col_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Verificando tabla order_logs...';
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_logs' AND column_name = 'status'
    ) INTO col_exists;
    IF NOT col_exists THEN missing_columns := array_append(missing_columns, 'status'); END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_logs' AND column_name = 'comment'
    ) INTO col_exists;
    IF NOT col_exists THEN missing_columns := array_append(missing_columns, 'comment'); END IF;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '❌ FALTAN CAMPOS EN ORDER_LOGS:';
        FOR i IN 1..array_length(missing_columns, 1) LOOP
            RAISE NOTICE '   - %', missing_columns[i];
        END LOOP;
    ELSE
        RAISE NOTICE '✅ Todos los campos necesarios existen en order_logs';
    END IF;
END $$;

-- =====================================================
-- VERIFICAR TABLA PAYMENT_TRANSACTIONS
-- =====================================================
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Verificando tabla payment_transactions...';
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'payment_transactions'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ Tabla payment_transactions existe';
    ELSE
        RAISE NOTICE '❌ Tabla payment_transactions NO existe';
        RAISE NOTICE '   Se recomienda crearla para un mejor tracking de pagos';
    END IF;
END $$;

-- =====================================================
-- VERIFICAR MÉTODOS DE PAGO
-- =====================================================
DO $$
DECLARE
    redsys_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Verificando métodos de pago...';
    
    SELECT EXISTS (
        SELECT 1 FROM payment_methods 
        WHERE provider = 'Redsys'
    ) INTO redsys_exists;
    
    IF redsys_exists THEN
        RAISE NOTICE '✅ Método de pago Redsys configurado';
    ELSE
        RAISE NOTICE '⚠️  Método de pago Redsys NO encontrado';
        RAISE NOTICE '   Ejecuta: UPDATE payment_methods SET provider = ''Redsys'' WHERE name LIKE ''%Tarjeta%'';';
    END IF;
END $$;

-- =====================================================
-- VERIFICAR MÉTODOS DE ENVÍO
-- =====================================================
DO $$
DECLARE
    shipping_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Verificando métodos de envío...';
    
    SELECT COUNT(*) INTO shipping_count FROM shipping_methods;
    
    IF shipping_count > 0 THEN
        RAISE NOTICE '✅ % métodos de envío configurados', shipping_count;
    ELSE
        RAISE NOTICE '⚠️  No hay métodos de envío configurados';
        RAISE NOTICE '   Visita /admin/checkout-setup para configurar';
    END IF;
END $$;

-- =====================================================
-- VERIFICAR CUPONES
-- =====================================================
DO $$
DECLARE
    coupon_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Verificando cupones...';
    
    SELECT COUNT(*) INTO coupon_count FROM coupons;
    
    IF coupon_count > 0 THEN
        RAISE NOTICE '✅ % cupones configurados', coupon_count;
    ELSE
        RAISE NOTICE 'ℹ️  No hay cupones configurados (opcional)';
    END IF;
END $$;

-- =====================================================
-- RESUMEN FINAL
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '📊 RESUMEN DE VERIFICACIÓN';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Si ves ❌ o ⚠️  arriba:';
    RAISE NOTICE '1. Ejecuta: database/add_redsys_fields.sql';
    RAISE NOTICE '2. Visita: /admin/checkout-setup';
    RAISE NOTICE '3. Actualiza el proveedor de tarjetas a Redsys';
    RAISE NOTICE '';
    RAISE NOTICE 'Si todo está ✅:';
    RAISE NOTICE '¡Tu base de datos está lista para Redsys!';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- MOSTRAR ESTRUCTURA ACTUAL DE ORDERS (OPCIONAL)
-- =====================================================
\echo ''
\echo '📋 Estructura actual de la tabla orders:'
\echo ''
SELECT 
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
