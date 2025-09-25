-- Script para agregar campo de dirección de facturación a la tabla orders
-- Ejecuta este script en tu consola SQL de Supabase

-- Agregar campo billing_address a la tabla orders
ALTER TABLE public.orders 
ADD COLUMN billing_address jsonb;

-- Comentar el campo para documentación
COMMENT ON COLUMN public.orders.billing_address IS 'Dirección de facturación en formato JSON con campos: first_name, last_name, email, phone, company_name, nif_cif, activity, company_position, address_line1, address_line2, city, region, postal_code, country';

-- Verificar que se agregó correctamente
\d public.orders;