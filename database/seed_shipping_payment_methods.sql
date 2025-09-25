-- Script para insertar métodos de envío y pago temporales
-- Ejecuta este script en tu consola SQL de Supabase

-- Insertar métodos de envío
INSERT INTO public.shipping_methods (name, price_cents, estimated_days) VALUES
('Envío Estándar', 500, 3),          -- 5.00 EUR, 3 días
('Envío Express', 1200, 1),          -- 12.00 EUR, 1 día
('Envío Gratis (+50€)', 0, 5),       -- Gratis, 5 días
('Recogida en Tienda', 0, 0);        -- Gratis, inmediato

-- Insertar métodos de pago
INSERT INTO public.payment_methods (name, provider, active) VALUES
('Tarjeta de Crédito/Débito', 'Stripe', true),
('PayPal', 'PayPal', true),
('Transferencia Bancaria', null, true),
('Contrareembolso', null, true),
('Bizum', 'Bizum', true);

-- Verificar que se insertaron correctamente
SELECT 'Métodos de Envío:' as tipo;
SELECT id, name, price_cents/100.0 as price_euros, estimated_days 
FROM public.shipping_methods 
ORDER BY price_cents;

SELECT 'Métodos de Pago:' as tipo;
SELECT id, name, provider, active 
FROM public.payment_methods 
WHERE active = true
ORDER BY name;