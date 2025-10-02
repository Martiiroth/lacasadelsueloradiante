-- Actualización de la tabla invoices para eliminar el campo status
-- Las facturas no tienen estados, solo se generan automáticamente cuando el pedido está entregado

-- Eliminar la columna status si existe
ALTER TABLE public.invoices DROP COLUMN IF EXISTS status;

-- Comentario: Las facturas ahora son documentos sin estado que se generan automáticamente