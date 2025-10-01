# 🚀 GUÍA COMPLETA: Actualizar VPS con la Solución de Imágenes

## 📋 RESUMEN

**¿Qué vamos a hacer?**
1. Actualizar el código en el VPS desde GitHub
2. Configurar el bucket de Supabase
3. Hacer deploy con las correcciones
4. Verificar que las imágenes funcionen

**Tiempo estimado:** 15-20 minutos

---

## 🔧 PASO 1: Conectar al VPS y Actualizar Código

### 1.1 Conectar al VPS

```bash
# Conectar a tu VPS (ajusta la IP/dominio y usuario)
ssh root@tu-servidor.com
# o
ssh usuario@lacasadelsueloradianteapp.com
```

### 1.2 Navegar al directorio del proyecto

```bash
# Ir al directorio del proyecto
cd /path/to/lacasadelsueloradiante
# o si está en la home:
cd ~/lacasadelsueloradiante
# o si está en /var/www:
cd /var/www/lacasadelsueloradiante
```

### 1.3 Actualizar código desde GitHub

```bash
# Verificar estado actual
git status

# Hacer backup del .env.production actual (por si acaso)
cp .env.production .env.production.backup

# Actualizar desde GitHub
git pull origin main

# Verificar que los archivos se descargaron
ls -la *IMAGEN*.md
ls -la deploy-with-image-fix.sh
```

**Deberías ver:**
```
ANALISIS_COMPLETO_IMAGENES.md
INDICE_IMAGENES.md
QUICK_START_IMAGENES.md
RESUMEN_IMAGENES.md
RESUMEN_VISUAL.md
SOLUCION_IMAGENES.md
deploy-with-image-fix.sh
```

### 1.4 Verificar cambios importantes

```bash
# Verificar que la URL de Supabase se actualizó
cat .env.production | grep NEXT_PUBLIC_SUPABASE_URL

# Debe mostrar:
# NEXT_PUBLIC_SUPABASE_URL=https://lacasadelsueloradianteapp.supabase.co
```

---

## 📊 PASO 2: Configurar Supabase Storage

### 2.1 Verificar bucket en Supabase Dashboard

1. **Abre en tu navegador:**
   ```
   https://supabase.lacasadelsueloradianteapp.com/project/default/storage/buckets
   ```

2. **Busca el bucket "product-images"**
   - ✅ Si existe, continúa al paso 2.2
   - ❌ Si no existe, créalo:
     - Click "New bucket"
     - Name: `product-images`
     - ✅ Marcar "Public bucket"
     - File size limit: 5MB
     - Allowed MIME types: `image/jpeg,image/jpg,image/png,image/webp`

### 2.2 Hacer el bucket público

1. **Si el bucket ya existe pero no es público:**
   - Click en "product-images"
   - Click en "Configuration"
   - ✅ Marcar "Public bucket"
   - Click "Save"

### 2.3 Aplicar políticas RLS

1. **Ve al SQL Editor:**
   ```
   https://supabase.lacasadelsueloradianteapp.com/project/default/sql
   ```

2. **Click en "New query"**

3. **Ejecuta este código SQL:**
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

   -- POLÍTICA DE ACTUALIZACIÓN
   CREATE POLICY "Authenticated users can update product images"
   ON storage.objects FOR UPDATE
   USING (
     bucket_id = 'product-images' 
     AND auth.role() = 'authenticated'
   )
   WITH CHECK (
     bucket_id = 'product-images' 
     AND auth.role() = 'authenticated'
   );

   -- POLÍTICA DE ELIMINACIÓN
   CREATE POLICY "Authenticated users can delete product images"
   ON storage.objects FOR DELETE
   USING (
     bucket_id = 'product-images' 
     AND auth.role() = 'authenticated'
   );
   ```

4. **Click en "Run"**

5. **Debe mostrar:** "Success. No rows returned"

---

## 🚀 PASO 3: Deploy en el VPS

### Opción A: Deploy Automático (RECOMENDADO)

```bash
# Hacer el script ejecutable
chmod +x deploy-with-image-fix.sh

# Ejecutar deploy automático
./deploy-with-image-fix.sh
```

### Opción B: Deploy Manual con Docker

```bash
# Verificar variables de entorno
cat .env.production | grep NEXT_PUBLIC_SUPABASE_URL

# Detener contenedores actuales
docker-compose down

# Limpiar builds anteriores
rm -rf .next
rm -rf node_modules/.cache

# Build sin cache
docker-compose build --no-cache

# Iniciar contenedores
docker-compose up -d

# Verificar logs
docker-compose logs -f --tail=50
```

### Opción C: Deploy Manual sin Docker

```bash
# Instalar dependencias (si es necesario)
npm install

# Build de producción
npm run build

# Reiniciar aplicación (ajusta según tu configuración)
pm2 restart lacasadelsueloradiante
# o
systemctl restart lacasadelsueloradiante
# o
supervisorctl restart lacasadelsueloradiante

# Verificar logs
pm2 logs lacasadelsueloradiante
```

---

## ✅ PASO 4: Verificación Post-Deploy

### 4.1 Verificar que la aplicación está funcionando

```bash
# Health check
curl -I http://localhost:3000

# Debe responder: HTTP/1.1 200 OK
```

### 4.2 Verificar en el navegador

1. **Abre tu sitio web:**
   ```
   https://lacasadelsueloradianteapp.com
   ```

2. **Abre DevTools (F12)**
   - Pestaña: **Network**
   - Filtro: **Img**

3. **Recarga la página (Ctrl+R o Cmd+R)**

4. **Verifica las imágenes:**
   - ✅ Status: **200**
   - ✅ URLs: `https://lacasadelsueloradianteapp.supabase.co/storage/...`
   - ❌ NO debe haber errores 403, 404, o Failed

### 4.3 Verificar consola del navegador

1. **Pestaña: Console**
2. **NO debe haber errores como:**
   - ❌ "Failed to load resource"
   - ❌ "Image with src ... is not configured"
   - ❌ "The image could not be loaded"

### 4.4 Ejecutar diagnóstico (Opcional)

```bash
# En el VPS, ejecutar diagnóstico
node scripts/diagnose-images-production.js

# Debe mostrar:
# ✅ Variables de entorno configuradas
# ✅ Dominio estándar de Supabase configurado
# ✅ Bucket existe y es público
```

---

## 🐛 TROUBLESHOOTING

### ❌ Problema: "Error 403 Forbidden" en imágenes

**Causa:** Bucket no es público o faltan políticas RLS

**Solución:**
1. Ve a Supabase Storage > Buckets
2. Asegúrate de que "product-images" esté marcado como público
3. Ejecuta las políticas SQL del Paso 2.3

### ❌ Problema: "Error 404 Not Found" en imágenes

**Causa:** No hay archivos en el bucket

**Solución:**
```bash
# Verificar archivos en el bucket
node scripts/check-storage-config.js
```

### ❌ Problema: Las imágenes siguen sin aparecer

**Causa:** Cache del navegador

**Solución:**
1. Refrescar con **Ctrl+Shift+R** (o **Cmd+Shift+R** en Mac)
2. O abrir en **modo incógnito**

### ❌ Problema: Error durante el build

**Causa:** Variables de entorno no disponibles durante build

**Solución:**
```bash
# Verificar variables
echo $NEXT_PUBLIC_SUPABASE_URL

# Si está vacía, cargar .env.production
export $(cat .env.production | xargs)

# Intentar build nuevamente
npm run build
```

### ❌ Problema: Docker no encuentra las variables

**Causa:** Docker no está cargando .env.production

**Solución:**
```bash
# Verificar docker-compose.yml
cat docker-compose.yml | grep NEXT_PUBLIC_SUPABASE

# Asegurar que las variables están en el sistema
source .env.production

# Build nuevamente
docker-compose build --no-cache --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
```

---

## 📊 CHECKLIST FINAL

### Antes de considerar terminado:

- [ ] ✅ Código actualizado desde GitHub
- [ ] ✅ Bucket "product-images" existe
- [ ] ✅ Bucket es público
- [ ] ✅ Políticas RLS aplicadas
- [ ] ✅ Deploy completado sin errores
- [ ] ✅ Aplicación accesible en navegador
- [ ] ✅ Imágenes cargan con status 200
- [ ] ✅ URLs de imágenes correctas (*.supabase.co)
- [ ] ✅ No hay errores en consola del navegador

---

## 🎉 RESULTADO ESPERADO

Después de completar todos los pasos:

```
┌──────────────────────────────────────────────────┐
│                                                  │
│    🖼️  [Imagen del producto cargando]            │
│                                                  │
│    Termostato Digital WiFi                       │
│    €149.99                                       │
│                                                  │
│    [ Añadir al carrito ]                         │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 🔍 COMANDOS DE VERIFICACIÓN RÁPIDA

```bash
# 1. Verificar URL en .env.production
cat .env.production | grep NEXT_PUBLIC_SUPABASE_URL

# 2. Verificar estado de contenedores (si usas Docker)
docker-compose ps

# 3. Verificar logs
docker-compose logs --tail=20
# o
pm2 logs lacasadelsueloradiante --lines 20

# 4. Health check
curl -I http://localhost:3000

# 5. Diagnóstico completo
node scripts/diagnose-images-production.js
```

---

## 📞 ¿NECESITAS AYUDA?

Si algo no funciona:

1. **Ejecuta el diagnóstico:**
   ```bash
   node scripts/diagnose-images-production.js
   ```

2. **Revisa logs detallados:**
   ```bash
   docker-compose logs --tail=100
   ```

3. **Verifica la configuración:**
   ```bash
   node scripts/check-storage-config.js
   ```

4. **Consulta la documentación:**
   - `QUICK_START_IMAGENES.md` - Solución rápida
   - `ANALISIS_COMPLETO_IMAGENES.md` - Análisis técnico
   - `SOLUCION_IMAGENES.md` - Troubleshooting completo

---

**¡Éxito con la actualización! 🚀**

*Creado el 1 de octubre de 2025*