# 🖼️ SOLUCIÓN: Imágenes no visibles en Producción

## ❌ PROBLEMA IDENTIFICADO

Las imágenes de productos no se visualizan después del despliegue en producción.

## 🔍 CAUSAS PRINCIPALES

### 1. **URL de Supabase incorrecta o no permitida en Next.js**
   - Next.js requiere que todos los dominios externos estén explícitamente permitidos en `next.config.js`
   - Las URLs de Supabase Storage tienen el formato: `https://[PROJECT_ID].supabase.co/storage/v1/object/public/[bucket]/[path]`
   - Si el dominio no está en `remotePatterns`, Next.js bloqueará las imágenes

### 2. **Bucket no público o sin políticas RLS correctas**
   - Si el bucket `product-images` no es público, las imágenes no serán accesibles
   - Si faltan las políticas RLS de lectura (SELECT), nadie podrá ver las imágenes
   - Las políticas deben permitir acceso público para lectura

### 3. **Variables de entorno no configuradas en producción**
   - `NEXT_PUBLIC_SUPABASE_URL` debe estar disponible en el entorno de producción
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` debe estar disponible en el entorno de producción
   - Estas variables se necesitan tanto en build-time como en runtime

### 4. **CORS o headers de seguridad bloqueando las imágenes**
   - Los headers de seguridad pueden estar bloqueando recursos externos
   - Nginx puede estar interfiriendo con las peticiones a Supabase

## ✅ SOLUCIONES APLICADAS

### 1. **Actualización de next.config.js** ✅
```javascript
images: {
  remotePatterns: [
    // Supabase Storage - Dominio principal del proyecto
    {
      protocol: 'https',
      hostname: 'lacasadelsueloradianteapp.supabase.co',
      port: '',
      pathname: '/storage/v1/object/public/**',
    },
    // Supabase - Wildcard para cualquier proyecto
    {
      protocol: 'https',
      hostname: '*.supabase.co',
      port: '',
      pathname: '/storage/v1/object/public/**',
    },
    // Dominio personalizado (si existe)
    {
      protocol: 'https',
      hostname: 'supabase.lacasadelsueloradianteapp.com',
      port: '',
      pathname: '/**',
    },
  ],
  formats: ['image/webp', 'image/avif'],
  minimumCacheTTL: 60,
}
```

### 2. **Script de diagnóstico creado** ✅
- Archivo: `scripts/check-storage-config.js`
- Verifica si el bucket existe
- Verifica si el bucket es público
- Lista archivos en el bucket
- Prueba generación de URLs públicas
- Verifica configuración de next.config.js

### 3. **Políticas SQL creadas** ✅
- Archivo: `scripts/setup-storage-policies.sql`
- Política de lectura pública (SELECT)
- Política de subida autenticada (INSERT)
- Política de actualización autenticada (UPDATE)
- Política de eliminación autenticada (DELETE)

## 🛠️ PASOS PARA RESOLVER EL PROBLEMA

### Paso 1: Verificar configuración de Supabase Storage

```bash
# Ejecutar script de diagnóstico
node scripts/check-storage-config.js
```

Esto te dirá exactamente qué está mal:
- ❌ Si el bucket no existe
- ❌ Si el bucket no es público
- ❌ Si faltan políticas RLS
- ❌ Si hay problemas con las URLs

### Paso 2: Crear o configurar el bucket (si no existe)

1. Ve al dashboard de Supabase: https://supabase.lacasadelsueloradianteapp.com
2. Navega a **Storage** en el menú lateral
3. Si no existe el bucket `product-images`:
   - Click en **New bucket**
   - **Name**: `product-images`
   - **Public bucket**: ✅ **ACTIVADO (CRÍTICO)**
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/webp`
   - Click en **Create bucket**

### Paso 3: Aplicar políticas RLS

1. Ve al dashboard de Supabase
2. Navega a **SQL Editor**
3. Click en **New query**
4. Copia y pega el contenido de `scripts/setup-storage-policies.sql`
5. Click en **Run** para ejecutar
6. Verifica que todas las políticas se crearon sin errores

### Paso 4: Verificar variables de entorno en producción

Asegúrate de que estas variables estén en tu servidor de producción:

```bash
# En el servidor VPS
cat .env.production | grep SUPABASE

# Deberías ver:
NEXT_PUBLIC_SUPABASE_URL=https://supabase.lacasadelsueloradianteapp.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOi...
```

### Paso 5: Rebuild y redeploy

Después de aplicar los cambios:

```bash
# Opción 1: Deploy con Docker
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Opción 2: Deploy directo (si no usas Docker)
npm run build
pm2 restart lacasadelsueloradiante
```

### Paso 6: Verificar en el navegador

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Network**
3. Recarga la página
4. Busca las peticiones de imágenes
5. Verifica:
   - ✅ Las URLs de las imágenes son correctas
   - ✅ El status es 200 (no 403 o 404)
   - ✅ Las imágenes se cargan correctamente

## 🐛 TROUBLESHOOTING

### Problema: "Failed to fetch" o error 403

**Causa**: El bucket no es público o faltan políticas RLS

**Solución**:
1. Ve a Storage > Policies en Supabase
2. Verifica que existe la política de SELECT
3. Si no existe, ejecuta `setup-storage-policies.sql`

### Problema: "Image with src ... is not configured"

**Causa**: El dominio no está permitido en `next.config.js`

**Solución**:
1. Abre `next.config.js`
2. Agrega el hostname exacto en `remotePatterns`
3. Rebuild la aplicación

### Problema: Las imágenes se ven en desarrollo pero no en producción

**Causa**: Variables de entorno no disponibles en producción

**Solución**:
1. Verifica `.env.production` en el servidor
2. Asegúrate de que Docker/PM2 está cargando las variables
3. Reinicia la aplicación

### Problema: Error "Bucket not found"

**Causa**: El bucket `product-images` no existe

**Solución**:
1. Ve a Storage en Supabase Dashboard
2. Crea el bucket manualmente
3. Márcalo como público

### Problema: URLs de imágenes incorrectas en la base de datos

**Causa**: Las URLs guardadas no coinciden con el formato real de Supabase

**Solución**:
```sql
-- Verificar URLs en la base de datos
SELECT id, url FROM product_images LIMIT 5;

-- Las URLs deben ser del tipo:
-- https://[PROJECT_ID].supabase.co/storage/v1/object/public/product-images/products/[filename]
```

## 📋 CHECKLIST FINAL

Antes de dar por resuelto el problema, verifica:

- [ ] El bucket `product-images` existe
- [ ] El bucket es público
- [ ] Las políticas RLS están aplicadas
- [ ] `next.config.js` tiene los dominios correctos
- [ ] Las variables de entorno están en producción
- [ ] La aplicación se rebuildeó después de los cambios
- [ ] Las imágenes cargan correctamente en el navegador
- [ ] No hay errores en la consola del navegador
- [ ] No hay errores 403 o 404 en las peticiones de imágenes

## 🔗 URLs de Referencia

- Dashboard de Supabase: https://supabase.lacasadelsueloradianteapp.com
- Documentación de Next.js Images: https://nextjs.org/docs/app/building-your-application/optimizing/images
- Documentación de Supabase Storage: https://supabase.com/docs/guides/storage

## 📞 CONTACTO

Si después de seguir estos pasos las imágenes aún no se visualizan:
1. Ejecuta `node scripts/check-storage-config.js` y comparte el output
2. Comparte los errores de la consola del navegador
3. Comparte los logs del servidor

---

**Última actualización**: 2024-10-01
