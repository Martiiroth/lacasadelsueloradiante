# 🚀 Comandos para Deployment en VPS

## Paso 1: Conectar al VPS
```bash
ssh root@tu-ip-vps
cd ~/lacasadelsueloradiante
```

## Paso 2: Pull de los últimos cambios
```bash
git pull origin main
```

## Paso 3: Cargar variables de entorno en el VPS (IMPORTANTE)

Docker Compose lee el archivo **`.env`** que está en la misma carpeta del proyecto. Sin ese archivo (o sin las variables correctas), la app no tendrá `SUPABASE_SERVICE_ROLE_KEY` ni el resto de configuración.

### Opción A – Ya tienes `.env.production` en el repo (o lo subes una vez)

```bash
# En el VPS, dentro de la carpeta del proyecto:
cp .env.production .env

# Comprueba que SUPABASE_SERVICE_ROLE_KEY está definida (no se mostrará el valor si usas set -a):
grep -q "SUPABASE_SERVICE_ROLE_KEY=" .env && echo "✅ Variable presente" || echo "❌ Falta SUPABASE_SERVICE_ROLE_KEY"
```

### Opción B – Crear `.env` a mano en el VPS

```bash
nano .env
```

Pega todas las variables que necesites (las mismas que en tu `.env` local), por ejemplo:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **`SUPABASE_SERVICE_ROLE_KEY`** ← imprescindible para crear clientes desde admin
- Variables de email, `NEXT_PUBLIC_APP_URL`, etc.

Guarda (Ctrl+O, Enter) y cierra (Ctrl+X).

### Opción C – Copiar `.env` desde tu PC al VPS (sin subirlo a Git)

Desde tu máquina local (en la carpeta del proyecto):

```bash
scp .env root@TU_IP_VPS:~/lacasadelsueloradiante/.env
```

Sustituye `TU_IP_VPS` por la IP o hostname del servidor.

### Importante

- El archivo **`.env` no se sube a Git** (está en `.gitignore`). Tienes que crearlo o copiarlo en el VPS como en los pasos anteriores.
- Después de tocar `.env` hay que **reconstruir y levantar** los contenedores para que cojan las nuevas variables (ver Paso 4).

## Paso 4: Deployment completo

**Después de tener el `.env` en el VPS**, construye y levanta los contenedores:

```bash
# 1. Parar contenedores
docker-compose stop

# 2. Eliminar contenedores (maneja el error de nginx externo)
docker-compose down --remove-orphans 2>/dev/null || true

# 3. Si hay error de red con nginx, pararlo primero
docker stop nginx-container 2>/dev/null || true
docker-compose down --remove-orphans

# 4. Build con las variables de .env (Docker Compose las lee del .env)
docker-compose build --no-cache

# 5. Levantar servicios
docker-compose up -d

# 6. Ver logs en tiempo real
docker-compose logs -f nextjs-app
```

O usa el script de deploy si lo tienes:

```bash
chmod +x deploy.sh
./deploy.sh
```

## Verificación

```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs recientes
docker-compose logs --tail=50 nextjs-app

# Verificar que responde
curl http://localhost:3000

# Verificar con el dominio
curl https://lacasadelsueloradianteapp.com
```

## Troubleshooting

### Si el build falla por red de nginx:
```bash
# Parar nginx externo
docker stop nginx-container

# Eliminar red manualmente
docker network rm lacasadelsueloradiante_app-network

# Volver a intentar
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d
```

### Si necesitas ver logs de error:
```bash
# Logs completos
docker-compose logs nextjs-app

# Logs en tiempo real
docker-compose logs -f nextjs-app

# Últimas 100 líneas
docker-compose logs --tail=100 nextjs-app
```

### Si el contenedor no arranca:
```bash
# Ver todos los contenedores (incluso los parados)
docker ps -a

# Ver logs del último intento
docker logs lacasadelsueloradiante_nextjs-app_1

# Intentar arrancar manualmente para ver error
docker-compose up nextjs-app
```

## Comandos útiles posteriores

```bash
# Reiniciar la app
docker-compose restart nextjs-app

# Ver uso de recursos
docker stats

# Limpiar imágenes antiguas
docker image prune -f

# Ver espacio usado
docker system df

# Limpieza completa (cuidado!)
docker system prune -a
```

## ✅ Todo correcto si ves:
- ✅ Build completo sin errores
- ✅ Container "Up" en `docker-compose ps`
- ✅ Logs sin errores críticos
- ✅ curl responde con HTML
- ✅ Página carga en navegador
