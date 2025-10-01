#!/bin/bash

# ============================================
# Script de Deploy con Fix de Imágenes
# ============================================

set -e  # Salir si hay errores

echo "🚀 Iniciando deploy con corrección de imágenes..."
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Verificar variables de entorno
echo -e "${BLUE}📋 1. Verificando variables de entorno...${NC}"
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: .env.production no existe${NC}"
    exit 1
fi

SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.production | cut -d '=' -f2)
echo "   URL de Supabase: $SUPABASE_URL"

if [[ $SUPABASE_URL == *"supabase.co"* ]]; then
    echo -e "${GREEN}   ✅ URL correcta (dominio estándar de Supabase)${NC}"
else
    echo -e "${YELLOW}   ⚠️  Advertencia: La URL no usa el dominio estándar de Supabase${NC}"
    echo "   Las imágenes pueden no cargarse correctamente"
fi

echo ""

# 2. Detener contenedores actuales
echo -e "${BLUE}📦 2. Deteniendo contenedores actuales...${NC}"
if [ -f docker-compose.yml ]; then
    docker-compose down
    echo -e "${GREEN}   ✅ Contenedores detenidos${NC}"
else
    echo -e "${YELLOW}   ⚠️  docker-compose.yml no encontrado${NC}"
fi

echo ""

# 3. Limpiar build anterior
echo -e "${BLUE}🧹 3. Limpiando builds anteriores...${NC}"
rm -rf .next
rm -rf node_modules/.cache
echo -e "${GREEN}   ✅ Cache limpiado${NC}"

echo ""

# 4. Rebuild de la imagen Docker
echo -e "${BLUE}🔨 4. Construyendo imagen Docker (sin cache)...${NC}"
docker-compose build --no-cache

if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ Imagen construida exitosamente${NC}"
else
    echo -e "${RED}   ❌ Error construyendo la imagen${NC}"
    exit 1
fi

echo ""

# 5. Iniciar contenedores
echo -e "${BLUE}🚀 5. Iniciando contenedores...${NC}"
docker-compose up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ Contenedores iniciados${NC}"
else
    echo -e "${RED}   ❌ Error iniciando contenedores${NC}"
    exit 1
fi

echo ""

# 6. Esperar a que la aplicación esté lista
echo -e "${BLUE}⏳ 6. Esperando a que la aplicación esté lista...${NC}"
sleep 10

# 7. Verificar logs
echo -e "${BLUE}📄 7. Verificando logs (últimas 20 líneas)...${NC}"
docker-compose logs --tail=20

echo ""

# 8. Verificar estado de contenedores
echo -e "${BLUE}🔍 8. Estado de contenedores:${NC}"
docker-compose ps

echo ""

# 9. Información de acceso
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✅ DEPLOY COMPLETADO                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🌐 Aplicación disponible en:${NC}"
echo "   - Local: http://localhost:3000"
echo "   - Producción: https://lacasadelsueloradianteapp.com"
echo ""
echo -e "${BLUE}📊 Comandos útiles:${NC}"
echo "   - Ver logs: docker-compose logs -f"
echo "   - Reiniciar: docker-compose restart"
echo "   - Detener: docker-compose down"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: Verifica las imágenes${NC}"
echo "   1. Abre la web en el navegador"
echo "   2. Abre DevTools (F12) > Network"
echo "   3. Verifica que las imágenes carguen con status 200"
echo "   4. Las URLs deben ser: https://lacasadelsueloradianteapp.supabase.co/storage/..."
echo ""

# 10. Opcional: Test de health check
echo -e "${BLUE}🏥 9. Health check...${NC}"
sleep 2
HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}" http://localhost:3000 || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}   ✅ Aplicación respondiendo correctamente (HTTP $HTTP_STATUS)${NC}"
elif [ "$HTTP_STATUS" = "000" ]; then
    echo -e "${YELLOW}   ⚠️  No se pudo verificar el estado (¿curl instalado?)${NC}"
else
    echo -e "${RED}   ❌ Aplicación no responde correctamente (HTTP $HTTP_STATUS)${NC}"
fi

echo ""
echo -e "${GREEN}✨ Deploy completado${NC}"
