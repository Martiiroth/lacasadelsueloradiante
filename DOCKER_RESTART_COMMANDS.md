# Comandos para reiniciar Docker Compose con los cambios del .env

# 1. PARAR contenedores (SIN borrar datos)
docker-compose down

# 2. INICIAR con nueva configuración
docker-compose up -d

# 3. Ver logs para verificar que todo funciona
docker-compose logs -f auth

# 4. Si hay problemas, ver logs específicos
docker-compose logs auth
docker-compose logs kong

# ========================================
# ALTERNATIVAS (si hay problemas):
# ========================================

# Reiniciar solo el servicio de auth (que maneja emails)
docker-compose restart auth

# Forzar rebuild si hay cambios en Dockerfile
docker-compose up -d --build

# Ver estado de todos los servicios
docker-compose ps

# Si necesitas borrar TODO y empezar limpio (CUIDADO: borra datos)
# docker-compose down -v --remove-orphans
# docker-compose up -d

# ========================================
# ERRORES EN TU docker-compose.yml:
# ========================================

# Tu docker-compose.yml tiene errores de formato:
# 1. 'name: supabase' debe estar comentado o eliminado
# 2. Los valores booleanos deben ser strings:
#    - LOGFLARE_SINGLE_TENANT: true  →  LOGFLARE_SINGLE_TENANT: "true"
#    - SEED_SELF_HOST: true  →  SEED_SELF_HOST: "true"
#    - CLUSTER_POSTGRES: true  →  CLUSTER_POSTGRES: "true"
#    - NEXT_PUBLIC_ENABLE_LOGS: true  →  NEXT_PUBLIC_ENABLE_LOGS: "true"

# Corrige esos errores antes de hacer docker-compose up