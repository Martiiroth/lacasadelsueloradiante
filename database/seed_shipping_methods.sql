-- Métodos de envío por defecto para el admin (crear pedidos) y checkout
-- Ejecutar en Supabase SQL Editor si la tabla shipping_methods está vacía

INSERT INTO shipping_methods (id, name, price_cents, estimated_days)
VALUES
  (gen_random_uuid(), 'Envío estándar', 599, 3),
  (gen_random_uuid(), 'Envío urgente', 1299, 1),
  (gen_random_uuid(), 'Recogida en tienda', 0, 0)
ON CONFLICT DO NOTHING;

-- Si la tabla no tiene constraint unique en (name), usar solo INSERT sin ON CONFLICT:
-- INSERT INTO shipping_methods (name, price_cents, estimated_days)
-- VALUES ('Envío estándar', 599, 3), ('Envío urgente', 1299, 1), ('Recogida en tienda', 0, 0);
