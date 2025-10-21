-- ============================================================================
-- SCRIPT DE RECONSTRUCCIÓN COMPLETA DEL SISTEMA DE FACTURAS
-- Fecha: 2025-10-20
-- Propósito: Crear desde cero un sistema de facturas robusto y funcional
-- ============================================================================

-- ============================================================================
-- 1. LIMPIAR TABLAS EXISTENTES (SI ES NECESARIO)
-- ============================================================================

-- Eliminar constraint y tablas existentes si hay problemas
-- DROP TABLE IF EXISTS public.invoices CASCADE;
-- DROP TABLE IF EXISTS public.invoice_counters CASCADE;

-- ============================================================================
-- 2. CREAR TABLA INVOICE_COUNTERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.invoice_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prefix TEXT NOT NULL DEFAULT 'FAC-',
    suffix TEXT NOT NULL DEFAULT '',
    next_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_prefix_suffix UNIQUE(prefix, suffix),
    CONSTRAINT positive_next_number CHECK (next_number > 0)
);

-- Comentario
COMMENT ON TABLE public.invoice_counters IS 'Contadores para numeración automática de facturas';
COMMENT ON COLUMN public.invoice_counters.prefix IS 'Prefijo de la factura (ej: FAC-, INV-)';
COMMENT ON COLUMN public.invoice_counters.suffix IS 'Sufijo de la factura (ej: -2025, -ES)';
COMMENT ON COLUMN public.invoice_counters.next_number IS 'Próximo número a usar';

-- ============================================================================
-- 3. CREAR TABLA INVOICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relaciones
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    
    -- Numeración
    invoice_number INTEGER NOT NULL,
    prefix TEXT NOT NULL DEFAULT 'FAC-',
    suffix TEXT NOT NULL DEFAULT '',
    
    -- Datos financieros
    total_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    
    -- Fechas
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadatos
    notes TEXT,
    pdf_generated BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,
    
    -- Constraints
    CONSTRAINT positive_total CHECK (total_cents > 0),
    CONSTRAINT valid_currency CHECK (currency IN ('EUR', 'USD', 'GBP')),
    CONSTRAINT unique_order_invoice UNIQUE(order_id),
    CONSTRAINT unique_invoice_number UNIQUE(prefix, invoice_number, suffix),
    CONSTRAINT valid_dates CHECK (due_date IS NULL OR due_date >= invoice_date)
);

-- Comentarios
COMMENT ON TABLE public.invoices IS 'Facturas del sistema';
COMMENT ON COLUMN public.invoices.invoice_number IS 'Número de factura secuencial';
COMMENT ON COLUMN public.invoices.total_cents IS 'Total en céntimos para evitar problemas de redondeo';
COMMENT ON COLUMN public.invoices.pdf_generated IS 'Indica si se ha generado el PDF';
COMMENT ON COLUMN public.invoices.email_sent IS 'Indica si se ha enviado por email';

-- ============================================================================
-- 4. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON public.invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_prefix_number ON public.invoices(prefix, invoice_number);

-- ============================================================================
-- 5. CREAR FUNCIÓN PARA OBTENER PRÓXIMO NÚMERO DE FACTURA
-- ============================================================================

CREATE OR REPLACE FUNCTION get_next_invoice_number(
    p_prefix TEXT DEFAULT 'FAC-',
    p_suffix TEXT DEFAULT ''
) RETURNS TABLE(
    counter_id UUID,
    prefix TEXT,
    suffix TEXT,
    next_number INTEGER
) AS $$
DECLARE
    v_counter_id UUID;
    v_next_number INTEGER;
BEGIN
    -- Intentar obtener contador existente
    SELECT id, next_number INTO v_counter_id, v_next_number
    FROM public.invoice_counters 
    WHERE invoice_counters.prefix = p_prefix 
    AND invoice_counters.suffix = p_suffix;
    
    -- Si no existe, crear uno nuevo
    IF v_counter_id IS NULL THEN
        INSERT INTO public.invoice_counters (prefix, suffix, next_number)
        VALUES (p_prefix, p_suffix, 1)
        RETURNING id, next_number INTO v_counter_id, v_next_number;
    END IF;
    
    -- Retornar datos del contador
    RETURN QUERY SELECT v_counter_id, p_prefix, p_suffix, v_next_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. CREAR FUNCIÓN PARA INCREMENTAR CONTADOR
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_invoice_counter(p_counter_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.invoice_counters 
    SET next_number = next_number + 1,
        updated_at = NOW()
    WHERE id = p_counter_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. CREAR FUNCIÓN PARA GENERAR FACTURA COMPLETA
-- ============================================================================

CREATE OR REPLACE FUNCTION create_invoice_with_number(
    p_client_id UUID,
    p_order_id UUID,
    p_total_cents INTEGER,
    p_currency TEXT DEFAULT 'EUR',
    p_prefix TEXT DEFAULT 'FAC-',
    p_suffix TEXT DEFAULT '',
    p_due_days INTEGER DEFAULT 30
) RETURNS TABLE(
    invoice_id UUID,
    invoice_number INTEGER,
    prefix TEXT,
    suffix TEXT,
    full_number TEXT
) AS $$
DECLARE
    v_counter RECORD;
    v_invoice_id UUID;
    v_due_date DATE;
BEGIN
    -- Verificar que no existe factura para este pedido
    IF EXISTS (SELECT 1 FROM public.invoices WHERE order_id = p_order_id) THEN
        RAISE EXCEPTION 'Ya existe una factura para el pedido %', p_order_id;
    END IF;
    
    -- Obtener próximo número
    SELECT * INTO v_counter FROM get_next_invoice_number(p_prefix, p_suffix);
    
    -- Calcular fecha de vencimiento
    v_due_date := CURRENT_DATE + INTERVAL '1 day' * p_due_days;
    
    -- Crear factura
    INSERT INTO public.invoices (
        client_id,
        order_id,
        invoice_number,
        prefix,
        suffix,
        total_cents,
        currency,
        due_date
    ) VALUES (
        p_client_id,
        p_order_id,
        v_counter.next_number,
        v_counter.prefix,
        v_counter.suffix,
        p_total_cents,
        p_currency,
        v_due_date
    ) RETURNING id INTO v_invoice_id;
    
    -- Incrementar contador
    PERFORM increment_invoice_counter(v_counter.counter_id);
    
    -- Retornar datos de la factura creada
    RETURN QUERY SELECT 
        v_invoice_id,
        v_counter.next_number,
        v_counter.prefix,
        v_counter.suffix,
        v_counter.prefix || v_counter.next_number || v_counter.suffix;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. CREAR POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_counters ENABLE ROW LEVEL SECURITY;

-- Política para invoices: Solo usuarios autenticados pueden ver sus facturas
CREATE POLICY "Users can view their own invoices" ON public.invoices
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            -- El usuario es el cliente de la factura
            client_id IN (
                SELECT id FROM public.clients WHERE user_id = auth.uid()
            )
            OR
            -- O el usuario es admin
            EXISTS (
                SELECT 1 FROM public.clients 
                WHERE user_id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Política para crear facturas: Solo admins
CREATE POLICY "Only admins can create invoices" ON public.invoices
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clients 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Política para actualizar facturas: Solo admins
CREATE POLICY "Only admins can update invoices" ON public.invoices
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.clients 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Política para contadores: Solo admins pueden ver y modificar
CREATE POLICY "Only admins can access invoice_counters" ON public.invoice_counters
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.clients 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- 9. INSERTAR CONTADOR INICIAL
-- ============================================================================

INSERT INTO public.invoice_counters (prefix, suffix, next_number)
VALUES ('FAC-', '-2025', 1)
ON CONFLICT (prefix, suffix) DO NOTHING;

-- ============================================================================
-- 10. CREAR TRIGGER PARA UPDATED_AT
-- ============================================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para invoices
DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para invoice_counters
DROP TRIGGER IF EXISTS update_invoice_counters_updated_at ON public.invoice_counters;
CREATE TRIGGER update_invoice_counters_updated_at
    BEFORE UPDATE ON public.invoice_counters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. VERIFICAR INSTALACIÓN
-- ============================================================================

-- Mostrar estado de las tablas creadas
SELECT 
    'invoices' as tabla,
    COUNT(*) as registros
FROM public.invoices
UNION ALL
SELECT 
    'invoice_counters' as tabla,
    COUNT(*) as registros
FROM public.invoice_counters;

-- ============================================================================
-- SCRIPT COMPLETADO
-- ============================================================================

-- Para probar el sistema:
-- 1. Ejecutar: SELECT * FROM get_next_invoice_number();
-- 2. Crear factura: SELECT * FROM create_invoice_with_number('[client_id]', '[order_id]', 10000);
-- 3. Verificar: SELECT * FROM public.invoices ORDER BY created_at DESC LIMIT 5;