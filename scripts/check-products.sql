-- Script para verificar productos existentes
SELECT 
  id, 
  title, 
  slug,
  created_at
FROM products 
ORDER BY created_at DESC 
LIMIT 10;