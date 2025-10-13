# 🎯 CONFIGURACIÓN PASO A PASO - SUPABASE STORAGE

## 📋 **STATUS**: Bucket no existe - necesita configuración manual

### **PASO 1: Ir a Supabase Dashboard**
```
URL: https://supabase.lacasadelsueloradianteapp.com
```

### **PASO 2: Crear Bucket Manualmente**
1. Click en **"Storage"** en el menú lateral
2. Click en **"New bucket"**
3. Configurar EXACTAMENTE así:
   ```
   Name: brand-logos
   Public bucket: ✅ SÍ (CRÍTICO)
   File size limit: 2097152 (2MB)
   Allowed MIME types: image/jpeg,image/jpg,image/png,image/gif,image/webp
   ```
4. Click **"Create bucket"**

### **PASO 3: Ejecutar SQL para Políticas**
1. Ve a **"SQL Editor"** 
2. Copia y pega TODO este código:

```sql
-- ===================================
-- CONFIGURACIÓN DE POLÍTICAS RLS
-- ===================================

-- Limpiar políticas existentes
DELETE FROM storage.policies WHERE bucket_id = 'brand-logos';

-- Política 1: Lectura pública (CRÍTICA)
INSERT INTO storage.policies (
  name, bucket_id, policy_definition, allowed_operation, target
) VALUES (
  'Public read access for brand logos',
  'brand-logos',
  'true',
  'SELECT',
  'object'
);

-- Política 2: Subida autenticada  
INSERT INTO storage.policies (
  name, bucket_id, policy_definition, allowed_operation, target
) VALUES (
  'Authenticated upload for brand logos',
  'brand-logos',
  'auth.role() = ''authenticated''',
  'INSERT', 
  'object'
);

-- Política 3: Actualización autenticada
INSERT INTO storage.policies (
  name, bucket_id, policy_definition, allowed_operation, target
) VALUES (
  'Authenticated update for brand logos',
  'brand-logos',
  'auth.role() = ''authenticated''',
  'UPDATE',
  'object'
);

-- Política 4: Eliminación autenticada
INSERT INTO storage.policies (
  name, bucket_id, policy_definition, allowed_operation, target  
) VALUES (
  'Authenticated delete for brand logos',
  'brand-logos',
  'auth.role() = ''authenticated''',
  'DELETE',
  'object'
);

-- VERIFICACIÓN FINAL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'brand-logos' AND public = true)
    THEN '✅ BUCKET OK'
    ELSE '❌ BUCKET ERROR'
  END as bucket_status,
  
  (SELECT COUNT(*) FROM storage.policies WHERE bucket_id = 'brand-logos') as policies_count,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM storage.policies WHERE bucket_id = 'brand-logos') >= 4
    THEN '✅ POLÍTICAS OK' 
    ELSE '❌ FALTAN POLÍTICAS'
  END as policies_status;
```

3. Click **"Run"**
4. Verificar que el resultado muestre:
   ```
   bucket_status: ✅ BUCKET OK
   policies_count: 4
   policies_status: ✅ POLÍTICAS OK
   ```

### **PASO 4: Verificar Funcionamiento**
Ejecuta este comando para probar:
```bash
node scripts/verify-storage.js
```

### **RESULTADO ESPERADO:**
- ✅ Bucket brand-logos existe y es público
- ✅ 4 políticas RLS configuradas
- ✅ Subida de archivos funciona
- ✅ URLs públicas accesibles

---

## 🔧 **DESPUÉS DE LA CONFIGURACIÓN**

### **Las imágenes se guardarán:**
- **Ubicación**: Supabase Storage bucket `brand-logos`
- **URLs**: `https://supabase.lacasadelsueloradianteapp.com/storage/v1/object/public/brand-logos/archivo.jpg`
- **Persistencia**: Permanente (no se pierden al refrescar)
- **Acceso**: Público (visible sin autenticación)

### **El sistema automáticamente:**
- ✅ Subirá archivos reales (no URLs temporales)
- ✅ Generará URLs públicas permanentes  
- ✅ Validará tipos y tamaños de archivo
- ✅ Manejará errores con fallbacks