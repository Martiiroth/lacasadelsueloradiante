-- ============================================================================
-- FUNCIONES RPC PARA FACTURAS CON PERMISOS ELEVADOS
-- Estas funciones permiten operaciones de facturación sin usar SERVICE_ROLE_KEY
-- ============================================================================

-- Función para generar factura automáticamente para un pedido
CREATE OR REPLACE FUNCTION generate_invoice_for_order(p_order_id UUID)
RETURNS JSON
SECURITY DEFINER -- Ejecuta con permisos del propietario de la función
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_order RECORD;
    v_client RECORD;
    v_existing_invoice RECORD;
    v_counter RECORD;
    v_invoice_id UUID;
    v_invoice_number INTEGER;
    v_result JSON;
BEGIN
    -- Log inicio
    RAISE LOG 'Iniciando generación de factura para pedido: %', p_order_id;
    
    -- 1. Verificar que el pedido existe y está entregado
    SELECT o.*, c.first_name, c.last_name, c.email
    INTO v_order
    FROM orders o
    LEFT JOIN clients c ON o.client_id = c.id
    WHERE o.id = p_order_id;
    
    IF NOT FOUND THEN
        RAISE LOG 'Pedido no encontrado: %', p_order_id;
        RETURN json_build_object('success', false, 'error', 'Pedido no encontrado');
    END IF;
    
    IF v_order.status != 'delivered' THEN
        RAISE LOG 'Pedido no está entregado: % (estado: %)', p_order_id, v_order.status;
        RETURN json_build_object('success', false, 'error', 'Pedido no está entregado');
    END IF;
    
    -- 2. Verificar si ya existe factura
    SELECT * INTO v_existing_invoice
    FROM invoices 
    WHERE order_id = p_order_id
    LIMIT 1;
    
    IF FOUND THEN
        RAISE LOG 'Ya existe factura para el pedido: %', p_order_id;
        RETURN json_build_object(
            'success', true, 
            'invoice', to_json(v_existing_invoice),
            'message', 'Factura ya existente'
        );
    END IF;
    
    -- 3. Obtener siguiente número de factura
    SELECT * INTO v_counter FROM invoice_counters WHERE year = EXTRACT(year FROM NOW())::INTEGER;
    
    IF NOT FOUND THEN
        -- Crear contador para el año actual
        INSERT INTO invoice_counters (year, current_number) 
        VALUES (EXTRACT(year FROM NOW())::INTEGER, 1)
        RETURNING * INTO v_counter;
        v_invoice_number := 1;
    ELSE
        -- Incrementar contador
        UPDATE invoice_counters 
        SET current_number = current_number + 1,
            updated_at = NOW()
        WHERE year = v_counter.year
        RETURNING current_number INTO v_invoice_number;
    END IF;
    
    -- 4. Crear factura
    v_invoice_id := gen_random_uuid();
    
    INSERT INTO invoices (
        id,
        client_id,
        order_id,
        invoice_number,
        prefix,
        suffix,
        total_cents,
        currency,
        status,
        due_date,
        notes,
        created_at,
        updated_at
    ) VALUES (
        v_invoice_id,
        v_order.client_id,
        p_order_id,
        v_invoice_number,
        'FAC-',
        '-' || EXTRACT(year FROM NOW())::TEXT,
        v_order.total_cents,
        'EUR',
        'pending',
        NOW() + INTERVAL '30 days',
        'Factura generada automáticamente para pedido ' || p_order_id,
        NOW(),
        NOW()
    );
    
    -- 5. Obtener factura creada con datos completos
    SELECT 
        i.*,
        json_build_object(
            'id', c.id,
            'first_name', c.first_name,
            'last_name', c.last_name,
            'email', c.email
        ) as client
    INTO v_result
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.id = v_invoice_id;
    
    RAISE LOG 'Factura creada exitosamente: % para pedido: %', v_invoice_id, p_order_id;
    
    RETURN json_build_object(
        'success', true,
        'invoice', row_to_json(v_result),
        'message', 'Factura creada exitosamente'
    );
    
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error generando factura: % - %', SQLSTATE, SQLERRM;
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Función para obtener factura por ID
CREATE OR REPLACE FUNCTION get_invoice_by_id(p_invoice_id UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_invoice RECORD;
BEGIN
    SELECT 
        i.*,
        json_build_object(
            'id', c.id,
            'first_name', c.first_name,
            'last_name', c.last_name,
            'email', c.email
        ) as client
    INTO v_invoice
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.id = p_invoice_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Factura no encontrada');
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'invoice', row_to_json(v_invoice)
    );
END;
$$;

-- Función para obtener todas las facturas con paginación
CREATE OR REPLACE FUNCTION get_all_invoices(p_page INTEGER DEFAULT 1, p_limit INTEGER DEFAULT 20)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_offset INTEGER;
    v_total INTEGER;
    v_invoices JSON;
BEGIN
    v_offset := (p_page - 1) * p_limit;
    
    -- Contar total
    SELECT COUNT(*) INTO v_total FROM invoices;
    
    -- Obtener facturas
    SELECT json_agg(
        json_build_object(
            'id', i.id,
            'client_id', i.client_id,
            'order_id', i.order_id,
            'invoice_number', i.invoice_number,
            'prefix', i.prefix,
            'suffix', i.suffix,
            'total_cents', i.total_cents,
            'currency', i.currency,
            'status', i.status,
            'created_at', i.created_at,
            'due_date', i.due_date,
            'client', json_build_object(
                'id', c.id,
                'first_name', c.first_name,
                'last_name', c.last_name,
                'email', c.email
            )
        )
    ) INTO v_invoices
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    ORDER BY i.created_at DESC
    LIMIT p_limit OFFSET v_offset;
    
    RETURN json_build_object(
        'invoices', COALESCE(v_invoices, '[]'::json),
        'total', v_total,
        'page', p_page,
        'totalPages', CEIL(v_total::float / p_limit::float)
    );
END;
$$;

-- Otorgar permisos para ejecutar las funciones a usuarios anónimos
GRANT EXECUTE ON FUNCTION generate_invoice_for_order(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_invoice_by_id(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_all_invoices(INTEGER, INTEGER) TO anon;

-- También a usuarios autenticados
GRANT EXECUTE ON FUNCTION generate_invoice_for_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_invoice_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_invoices(INTEGER, INTEGER) TO authenticated;