#!/bin/bash

# Script de diagnóstico para errores 502 Bad Gateway
# Identifica las posibles causas del problema

echo "🔍 DIAGNÓSTICO 502 BAD GATEWAY - La Casa del Suelo Radiante"
echo "============================================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para checks con colores
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo "1. VERIFICANDO ESTADO DE DOCKER CONTAINERS"
echo "-------------------------------------------"

# Verificar si Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker no está corriendo${NC}"
    exit 1
fi

# Estado de containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" --filter "name=lacasadelsueloradiante"

echo ""
echo "2. VERIFICANDO PUERTOS Y CONEXIONES"
echo "-----------------------------------"

# Verificar puerto 3000 (Next.js)
if netstat -tuln | grep -q ":3000 "; then
    check_status 0 "Puerto 3000 (Next.js) está escuchando"
else
    check_status 1 "Puerto 3000 (Next.js) no está disponible"
fi

# Verificar puerto 80 (HTTP)
if netstat -tuln | grep -q ":80 "; then
    check_status 0 "Puerto 80 (HTTP) está escuchando"
else
    check_status 1 "Puerto 80 (HTTP) no está disponible"
fi

# Verificar puerto 443 (HTTPS)
if netstat -tuln | grep -q ":443 "; then
    check_status 0 "Puerto 443 (HTTPS) está escuchando"
else
    check_status 1 "Puerto 443 (HTTPS) no está disponible"
fi

echo ""
echo "3. VERIFICANDO LOGS DE CONTAINERS"
echo "---------------------------------"

# Buscar containers relacionados
NEXTJS_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "(nextjs|lacasa)" | head -1)
NGINX_CONTAINER=$(docker ps --format "{{.Names}}" | grep nginx | head -1)

if [ -n "$NEXTJS_CONTAINER" ]; then
    info "Container Next.js encontrado: $NEXTJS_CONTAINER"
    echo "Últimas 10 líneas de logs:"
    docker logs --tail 10 "$NEXTJS_CONTAINER" 2>&1 | head -10
else
    warning "No se encontró container de Next.js activo"
fi

if [ -n "$NGINX_CONTAINER" ]; then
    info "Container Nginx encontrado: $NGINX_CONTAINER"
    echo "Últimas 10 líneas de logs:"
    docker logs --tail 10 "$NGINX_CONTAINER" 2>&1 | head -10
else
    warning "No se encontró container de Nginx activo"
fi

echo ""
echo "4. VERIFICANDO CONECTIVIDAD INTERNA"
echo "-----------------------------------"

# Test de conectividad a localhost:3000
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    check_status 0 "Aplicación Next.js responde en localhost:3000"
else
    check_status 1 "Aplicación Next.js no responde en localhost:3000"
fi

echo ""
echo "5. VERIFICANDO RECURSOS DEL SISTEMA"
echo "-----------------------------------"

# Memoria
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
if (( $(echo "$MEMORY_USAGE < 90" | bc -l) )); then
    check_status 0 "Uso de memoria: ${MEMORY_USAGE}%"
else
    check_status 1 "Uso de memoria alto: ${MEMORY_USAGE}%"
fi

# Disco
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 90 ]; then
    check_status 0 "Uso de disco: ${DISK_USAGE}%"
else
    check_status 1 "Uso de disco alto: ${DISK_USAGE}%"
fi

# CPU Load
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
info "Load average: $LOAD_AVG"

echo ""
echo "6. POSIBLES CAUSAS DE 502 BAD GATEWAY"
echo "====================================="

echo ""
echo "🔧 POSIBLES SOLUCIONES:"
echo "----------------------"
echo "1. Reiniciar containers:"
echo "   docker-compose down && docker-compose up -d"
echo ""
echo "2. Verificar logs en tiempo real:"
echo "   docker-compose logs -f"
echo ""
echo "3. Verificar configuración de nginx:"
echo "   Revisar upstream en nginx.conf"
echo ""
echo "4. Verificar variables de entorno:"
echo "   Asegurarse que .env esté cargado correctamente"
echo ""
echo "5. Limpiar y rebuildar:"
echo "   docker-compose down -v"
echo "   docker system prune -f"
echo "   docker-compose up --build -d"
echo ""

echo "📊 COMANDOS ÚTILES PARA DEBUGGING:"
echo "----------------------------------"
echo "• Ver todos los containers: docker ps -a"
echo "• Ver logs de Next.js: docker logs -f \$CONTAINER_NAME"
echo "• Entrar en container: docker exec -it \$CONTAINER_NAME sh"
echo "• Ver uso de recursos: docker stats"
echo "• Verificar red: docker network ls"
echo ""