# 🚀 GUÍA RÁPIDA: Solucionar Imágenes en Producción

## ⏱️ Tiempo estimado: 15 minutos

---

## ✅ PROBLEMA RESUELTO EN EL CÓDIGO

Ya he aplicado las siguientes correcciones:

1. ✅ **Actualizado `.env.production`** con la URL correcta de Supabase
2. ✅ **Configurado `next.config.js`** con los dominios permitidos
3. ✅ **Creados scripts de diagnóstico** y políticas SQL
4. ✅ **Creado script de deploy** automatizado

---

## 🎯 PASOS PARA APLICAR EN PRODUCCIÓN

### PASO 1: Verificar Bucket en Supabase (2 min)

1. Abre: https://supabase.lacasadelsueloradianteapp.com/project/default/storage/buckets/product-images

2. Verifica que:
   - [ ] El bucket existe ✅
   - [ ] El bucket es **PÚBLICO** (debe tener un checkbox marcado)
   
3. Si NO es público:
   - Click en el bucket "product-images"
   - Click en "Configuration"
   - Marca el checkbox "Public bucket"
   - Guarda cambios

### PASO 2: Aplicar Políticas RLS (3 min)

1. Ve a: https://supabase.lacasadelsueloradianteapp.com/project/default/sql

2. Click en "New query"

3. Ejecuta este comando:

```sql
-- POLÍTICA DE LECTURA PÚBLICA (CRÍTICA)
CREATE POLICY "Public Access to product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- POLÍTICA DE SUBIDA (usuarios autenticados)
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
```

4. Click en "Run" o "Ejecutar"

5. Deberías ver: "Success. No rows returned"

### PASO 3: Deploy en VPS (10 min)

#### Opción A: Script Automático (RECOMENDADO)

```bash
# SSH a tu VPS
ssh usuario@tu-vps.com

# Navega al proyecto
cd /ruta/a/lacasadelsueloradiante

# Actualiza el código (si usas git)
git pull

# Ejecuta el script de deploy
./deploy-with-image-fix.sh
```

#### Opción B: Manual con Docker

```bash
# SSH a tu VPS
ssh usuario@tu-vps.com

# Navega al proyecto
cd /ruta/a/lacasadelsueloradiante

# Actualiza .env.production (ya debería estar correcto)
cat .env.production | grep NEXT_PUBLIC_SUPABASE_URL
# Debe mostrar: https://lacasadelsueloradianteapp.supabase.co

# Deploy
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Verifica logs
docker-compose logs -f --tail=50
```

#### Opción C: Sin Docker (PM2)

```bash
# SSH a tu VPS
ssh usuario@tu-vps.com

# Navega al proyecto
cd /ruta/a/lacasadelsueloradiante

# Build
npm run build

# Restart
pm2 restart lacasadelsueloradiante

# Verifica logs
pm2 logs lacasadelsueloradiante
```

---

## ✅ VERIFICACIÓN (5 min)

### 1. Abre la web

```
https://lacasadelsueloradianteapp.com
```

### 2. Abre DevTools (F12)

- Click en pestaña "Network"
- Click en "Img" para filtrar
- Recarga la página (Ctrl+R o Cmd+R)

### 3. Verifica las imágenes

Busca peticiones como:
```
https://lacasadelsueloradianteapp.supabase.co/storage/v1/object/public/product-images/...
```

**Debe mostrar:**
- Status: 200 ✅
- Size: tamaño del archivo (ej: 125 KB)
- Time: tiempo de carga (ej: 234 ms)

**NO debe mostrar:**
- Status: 403 ❌ (Bucket no público o sin políticas)
- Status: 404 ❌ (Archivo no existe)
- Status: Failed ❌ (Error de conexión)

### 4. Verifica en la consola

- Pestaña "Console"
- NO debe haber errores de imágenes
- NO debe decir "Failed to load image"

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### ❌ Error: "Status 403 Forbidden"

**Causa**: Bucket no es público o faltan políticas

**Solución**:
1. Ve a Supabase Storage > Buckets
2. Haz el bucket "product-images" público
3. Ejecuta las políticas SQL del PASO 2

### ❌ Error: "Status 404 Not Found"

**Causa**: El archivo no existe en el bucket

**Solución**:
```bash
# Ejecuta el diagnóstico
node scripts/check-storage-config.js
```

Verifica que haya archivos en la carpeta "products"

### ❌ Las imágenes siguen sin aparecer

**Causa**: Cache del navegador

**Solución**:
1. Refresca con Ctrl+Shift+R (o Cmd+Shift+R en Mac)
2. O abre en modo incógnito
3. O limpia el cache del navegador

### ❌ Error: "Image with src ... is not configured"

**Causa**: Dominio no permitido en next.config.js

**Solución**: Ya está corregido, solo necesitas rebuild:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 📊 CHECKLIST FINAL

Antes de considerar el problema resuelto:

- [ ] Bucket "product-images" existe
- [ ] Bucket es público
- [ ] Políticas RLS aplicadas
- [ ] Deploy completado sin errores
- [ ] Aplicación accesible
- [ ] Imágenes cargan con status 200
- [ ] No hay errores en consola del navegador
- [ ] URLs de imágenes son `*.supabase.co/storage/...`

---

## 🎉 ¡LISTO!

Si todos los checkboxes están marcados, **el problema está resuelto**.

---

## 📞 ¿NECESITAS AYUDA?

Si algo no funciona:

1. Ejecuta el diagnóstico:
   ```bash
   node scripts/diagnose-images-production.js
   ```

2. Revisa los logs:
   ```bash
   docker-compose logs --tail=100
   ```

3. Verifica los archivos:
   ```bash
   node scripts/check-storage-config.js
   ```

4. Revisa la documentación completa:
   - `ANALISIS_COMPLETO_IMAGENES.md` - Análisis técnico detallado
   - `SOLUCION_IMAGENES.md` - Guía de solución completa
   - `RESUMEN_IMAGENES.md` - Resumen ejecutivo

---

**¡Éxito con el deploy! 🚀**
