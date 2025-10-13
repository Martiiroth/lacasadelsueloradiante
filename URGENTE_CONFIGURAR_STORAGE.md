# 🚨 **SOLUCIÓN URGENTE: Configurar Storage**

## 🔍 **Problema Detectado**
```
CORS Error: bucket 'brand-logos' no existe o no es público
Bad Request (400): URL de subida mal formada
```

## ✅ **Solución Inmediata**

### **Paso 1: Verificar Estado Actual**
1. Ejecuta en Supabase SQL Editor: `/database/verify_storage_complete.sql`
2. Mira la sección "Verificación final" al final del resultado

### **Paso 2: Crear Bucket (Si no existe)**
1. Ve a https://supabase.lacasadelsueloradianteapp.com
2. **Storage** → **New bucket**
3. Configuración EXACTA:
   ```
   Name: brand-logos
   Public bucket: ✅ SÍ (CRÍTICO)
   File size limit: 2097152 (2MB)
   Allowed MIME types: image/jpeg,image/jpg,image/png,image/gif,image/webp
   ```

### **Paso 3: Configurar Políticas**
Ejecuta en SQL Editor el script `/database/verify_storage_complete.sql` completo

### **Paso 4: Verificar URLs**
Las URLs deben verse así:
```
https://[tu-proyecto].supabase.co/storage/v1/object/public/brand-logos/archivo.jpg
```

## 🔧 **Implementé Fallback Temporal**
- ✅ El sistema ahora usa URLs temporales si Storage falla
- ✅ Las imágenes funcionarán durante la sesión
- ⚠️ Se perderán al refrescar hasta configurar Storage

## 📋 **Checklist de Configuración**

- [ ] Verificar que el bucket `brand-logos` existe
- [ ] Confirmar que el bucket es **público**
- [ ] Ejecutar script de políticas RLS
- [ ] Probar subida desde el panel admin
- [ ] Verificar que las URLs generadas son públicas

## 🚀 **Una vez configurado:**
- Las imágenes se guardarán permanentemente
- URLs públicas accesibles sin CORS
- Sin necesidad de fallbacks temporales

---

## 🆘 **Si sigue fallando:**

1. **Revisar configuración de CORS** en Supabase
2. **Verificar permisos** de usuario autenticado
3. **Comprobar variables de entorno** (.env.local)
4. **Ejecutar diagnóstico** completo con el script SQL