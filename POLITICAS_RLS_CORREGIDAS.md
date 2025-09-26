# Políticas RLS Corregidas para Supabase Storage

## ❌ ERROR: WITH CHECK no funciona con SELECT o DELETE

Las políticas correctas son:

## ✅ Políticas Correctas para Ejecutar:

### 1. Lectura Pública (SELECT)
```sql
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');
```

### 2. Subida Autenticada (INSERT)  
```sql
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
```

### 3. Actualización Autenticada (UPDATE)
```sql
CREATE POLICY "Authenticated users can update images" ON storage.objects
FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
```

### 4. Eliminación Autenticada (DELETE)
```sql
CREATE POLICY "Authenticated users can delete images" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
```

## 🔧 Diferencias Importantes:

- **SELECT**: Solo usa `USING` (no `WITH CHECK`)
- **INSERT**: Solo usa `WITH CHECK` (no `USING`)  
- **UPDATE**: Usa tanto `USING` como `WITH CHECK`
- **DELETE**: Solo usa `USING` (no `WITH CHECK`)

## 📝 Instrucciones:

1. Ve al **SQL Editor** en Supabase
2. Ejecuta cada política **una por una** 
3. Si alguna falla, puede ser porque ya existe - elimínala primero:

```sql
-- Para eliminar políticas existentes si es necesario:
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;  
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
```

4. Luego ejecuta las 4 políticas correctas mostradas arriba