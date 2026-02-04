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

## Paso 3: Crear archivo .env (IMPORTANTE)
```bash
# Copia el archivo .env.production.final como .env
cp .env.production.final .env

# Verifica que se copió correctamente
cat .env
```

## Paso 4: Deployment completo
```bash
# Opción A - Usando el script automático (RECOMENDADO)
chmod +x deploy-vps-with-env.sh
./deploy-vps-with-env.sh
```

**O si prefieres manual:**

```bash
# Opción B - Comandos manuales paso a paso

# 1. Parar contenedores
docker-compose stop

# 2. Eliminar contenedores (maneja el error de nginx externo)
docker-compose down --remove-orphans 2>/dev/null || true

# 3. Si hay error de red con nginx, pararlo primero
docker stop nginx-container 2>/dev/null || true
docker-compose down --remove-orphans

# 4. Build con las variables de .env
docker-compose build --no-cache

# 5. Levantar servicios
docker-compose up -d

# 6. Ver logs en tiempo real
docker-compose logs -f nextjs-app
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
