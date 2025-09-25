-- Script adicional para insertar roles de cliente temporales
-- Ejecuta este script después del anterior en tu consola SQL de Supabase

-- Insertar roles de cliente básicos
INSERT INTO public.customer_roles (name, description) VALUES
('cliente_particular', 'Cliente particular sin descuentos especiales'),
('cliente_profesional', 'Cliente profesional con descuentos por volumen'),
('distribuidor', 'Distribuidor autorizado con precios especiales'),
('vip', 'Cliente VIP con máximos descuentos');

-- Verificar que se insertaron correctamente
SELECT 'Roles de Cliente:' as tipo;
SELECT id, name, description 
FROM public.customer_roles 
ORDER BY id;