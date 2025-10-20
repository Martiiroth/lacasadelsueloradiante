-- Script para corregir problemas de facturas en producción

-- 1. Verificar si existe el campo status (debería dar error si fue eliminado)
-- SELECT status FROM invoices LIMIT 1;

-- 2. Eliminar campo status si aún existe
ALTER TABLE public.invoices DROP COLUMN IF EXISTS status;

-- 3. Verificar facturas duplicadas problemáticas
SELECT id, prefix, invoice_number, suffix, order_id, created_at 
FROM invoices 
WHERE prefix = 'W-' AND invoice_number = 67 AND suffix = '-25';

-- 4. Si hay duplicados, eliminar el más reciente (conservar el primero)
-- DELETE FROM invoices 
-- WHERE id IN (
--   SELECT id FROM invoices 
--   WHERE prefix = 'W-' AND invoice_number = 67 AND suffix = '-25'
--   ORDER BY created_at DESC 
--   LIMIT 1
-- );

-- 5. Verificar estado del contador de facturas
SELECT * FROM invoice_counters;

-- 6. Ajustar contador si es necesario (debe ser mayor que el último número usado)
-- UPDATE invoice_counters 
-- SET next_number = (
--   SELECT COALESCE(MAX(invoice_number), 0) + 1 
--   FROM invoices 
--   WHERE prefix = 'FAC-'
-- )
-- WHERE prefix = 'FAC-';

-- 7. Verificar constraint único
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'invoices' 
AND constraint_type = 'UNIQUE';

-- 8. Mostrar información de la factura que no se puede visualizar
SELECT * FROM invoices WHERE id = '5972abe7-b333-427a-b5b3-b459a11a187e';