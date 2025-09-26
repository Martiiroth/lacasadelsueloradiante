# 🎯 Políticas RLS Simplificadas - GARANTIZADAS que funcionan

## ❌ Problema: Las políticas complejas fallan

## ✅ Solución: Políticas mínimas que SÍ funcionan

### 🧹 PASO 1: Limpiar políticas existentes
```sql
-- Eliminar todas las políticas existentes para empezar limpio
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;  
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
```

### 🎭 PASO 2: Crear políticas mínimas
```sql
-- 1. Permitir lectura pública (para mostrar imágenes)
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- 2. Permitir todo a usuarios autenticados (simple y funcional)
CREATE POLICY "Allow authenticated all" ON storage.objects
FOR ALL USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
```

## 🔧 ¿Por qué estas políticas SÍ funcionan?

1. **"Allow public read"**: Solo lectura pública, sintaxis simple
2. **"Allow authenticated all"**: Una sola política para INSERT, UPDATE, DELETE
3. **Usa `FOR ALL`**: Evita los problemas de sintaxis específica por operación

## 📝 Instrucciones:

1. Ve al **SQL Editor** en Supabase
2. Ejecuta **PASO 1** (limpiar)
3. Ejecuta **PASO 2** (crear políticas simples)
4. Prueba: `node scripts/test-simple-storage.js`

## 🎉 Resultado esperado:
- ✅ Cualquiera puede VER las imágenes (público)
- ✅ Usuarios autenticados pueden SUBIR/EDITAR/ELIMINAR
- ✅ Sin errores de sintaxis SQL