# 📁 Manual de Configuración: Supabase Storage para Logos de Marcas

## 🎯 **Problema Identificado**
Las imágenes de marca no se están guardando permanentemente. Actualmente solo se crean URLs temporales que se pierden al refrescar la página.

## ✅ **Solución Implementada**
- ✅ Actualizado `ImageService` para usar Supabase Storage
- ✅ Creado script SQL para configurar políticas
- 🔄 **PENDIENTE**: Configurar el bucket en Supabase Dashboard

---

## 📋 **Pasos para Configurar Storage**

### **Paso 1: Crear el Bucket**
1. Ve al dashboard de Supabase: https://supabase.lacasadelsueloradianteapp.com
2. En el menú lateral, haz clic en **Storage**
3. Haz clic en **New bucket**
4. Configura el bucket:
   - **Name**: `brand-logos`
   - **Public bucket**: ✅ **SÍ** (muy importante)
   - **File size limit**: `2MB`
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/gif,image/webp`

### **Paso 2: Configurar Políticas RLS**
1. Ve a **SQL Editor** en el dashboard
2. Ejecuta el script: `/database/setup_brand_logos_storage.sql`
3. O copia y pega estas políticas una por una:

```sql
-- Lectura pública (cualquiera puede ver logos)
INSERT INTO storage.policies (name, bucket_id, policy_definition, allowed_operation, target)
VALUES (
  'Public Access for Brand Logos',
  'brand-logos',
  'true',
  'SELECT',
  'object'
);

-- Subida autenticada
INSERT INTO storage.policies (name, bucket_id, policy_definition, allowed_operation, target)
VALUES (
  'Authenticated users can upload brand logos',
  'brand-logos', 
  'auth.role() = ''authenticated''',
  'INSERT',
  'object'
);

-- Actualización autenticada
INSERT INTO storage.policies (name, bucket_id, policy_definition, allowed_operation, target)
VALUES (
  'Authenticated users can update brand logos',
  'brand-logos',
  'auth.role() = ''authenticated''',
  'UPDATE', 
  'object'
);

-- Eliminación autenticada
INSERT INTO storage.policies (name, bucket_id, policy_definition, allowed_operation, target)
VALUES (
  'Authenticated users can delete brand logos',
  'brand-logos',
  'auth.role() = ''authenticated''',
  'DELETE',
  'object'
);
```

### **Paso 3: Verificar Configuración**
Ejecuta este query para verificar:
```sql
SELECT 
  name,
  bucket_id,
  policy_definition,
  allowed_operation
FROM storage.policies 
WHERE bucket_id = 'brand-logos';
```

---

## 🔧 **Cambios Implementados en el Código**

### **ImageService Actualizado**
- ✅ Importa cliente de Supabase
- ✅ Sube archivos reales a `brand-logos` bucket
- ✅ Genera nombres únicos con timestamp
- ✅ Retorna URLs públicas permanentes
- ✅ Incluye método para eliminar imágenes
- ✅ Manejo robusto de errores

### **Funcionalidades Nuevas**
1. **uploadImage()**: Sube archivo real a Storage
2. **deleteImage()**: Elimina archivo del Storage  
3. **Validaciones**: Tipo, tamaño, errores
4. **Logging**: Debug detallado de operaciones

---

## 🚀 **Próximos Pasos**

1. **Configurar el bucket** siguiendo el Paso 1 y 2
2. **Probar subida** de una imagen desde el panel admin
3. **Verificar persistencia** refrescando la página
4. **Comprobar URLs** que empiecen con tu dominio de Supabase

---

## ⚠️ **Notas Importantes**

- **Bucket debe ser público** para que las imágenes sean visibles
- **Políticas RLS** permiten subida solo a usuarios autenticados
- **URLs generadas** serán permanentes y accesibles públicamente
- **Archivos antiguos** (URLs temporales) no funcionarán

---

## 📊 **Estado Actual**

| Componente | Estado | Notas |
|------------|--------|-------|
| ImageService | ✅ Implementado | Supabase Storage integrado |
| Database Script | ✅ Creado | setup_brand_logos_storage.sql |
| Bucket Storage | ⏳ Pendiente | Requiere configuración manual |
| Políticas RLS | ⏳ Pendiente | Ejecutar script SQL |
| Pruebas | ⏳ Pendiente | Después de configuración |

**Una vez configurado el Storage, las imágenes se guardarán permanentemente y no se perderán al refrescar la página.**