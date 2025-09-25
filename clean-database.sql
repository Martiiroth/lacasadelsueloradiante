-- Script para limpiar la base de datos antes de insertar datos de prueba
-- Ejecutar PRIMERO este script en Supabase SQL Editor

-- ADVERTENCIA: Esto eliminará TODOS los datos de las tablas de productos
-- Solo usar en desarrollo/testing

-- Eliminar en orden para respetar las foreign keys
DELETE FROM cart_items;
DELETE FROM carts;
DELETE FROM product_reviews;
DELETE FROM product_resources;
DELETE FROM product_images;
DELETE FROM role_prices;
DELETE FROM product_variants;
DELETE FROM product_categories;
DELETE FROM products;
DELETE FROM categories;
-- No eliminamos customer_roles porque son datos maestros

-- Verificar que las tablas están vacías
SELECT 'Después de limpieza:';
SELECT 'Carritos eliminados: ' || COUNT(*) FROM carts;
SELECT 'Items de carrito eliminados: ' || COUNT(*) FROM cart_items;
SELECT 'Reseñas eliminadas: ' || COUNT(*) FROM product_reviews;
SELECT 'Recursos eliminados: ' || COUNT(*) FROM product_resources;
SELECT 'Imágenes eliminadas: ' || COUNT(*) FROM product_images;
SELECT 'Precios especiales eliminados: ' || COUNT(*) FROM role_prices;
SELECT 'Variantes eliminadas: ' || COUNT(*) FROM product_variants;
SELECT 'Relaciones producto-categoría eliminadas: ' || COUNT(*) FROM product_categories;
SELECT 'Productos eliminados: ' || COUNT(*) FROM products;
SELECT 'Categorías eliminadas: ' || COUNT(*) FROM categories;
SELECT 'Roles conservados: ' || COUNT(*) FROM customer_roles;

SELECT '✅ Base de datos limpia y lista para nuevos datos de prueba';