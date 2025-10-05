#!/bin/bash
# Script para deployment en VPS con configuración de variables de entorno

set -e  # Salir si hay errores

echo "================================================"
echo "🚀 DEPLOYMENT VPS - Con configuración de .env"
echo "================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Este script debe ejecutarse desde la raíz del proyecto${NC}"
    exit 1
fi

echo -e "\n${YELLOW}📋 Paso 1: Verificando archivo .env${NC}"

# Verificar si existe .env
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ No se encontró archivo .env${NC}"
    echo -e "${YELLOW}Por favor, crea un archivo .env con las siguientes variables:${NC}"
    echo ""
    cat << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key

# Database
DATABASE_URL=tu_database_url

# Email Configuration
EMAIL_USER=tu_email
EMAIL_PASSWORD=tu_password_aplicacion
EMAIL_FROM_NAME=La Casa del Suelo Radiante
EMAIL_FROM_ADDRESS=tu_email
EMAIL_REPLY_TO=tu_email
EMAIL_ADMIN_ADDRESS=tu_email

# NextAuth
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=tu_secret_generado

# App URLs
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
NEXT_PUBLIC_API_URL=https://tu-dominio.com/api

# Business Information
BUSINESS_NAME=La Casa del Suelo Radiante
BUSINESS_ADDRESS=Tu dirección
BUSINESS_PHONE=Tu teléfono
BUSINESS_EMAIL=Tu email
BUSINESS_CIF=Tu CIF

# Environment
NODE_ENV=production
EOF
    echo ""
    echo -e "${YELLOW}Puedes copiar .env.production.example y modificarlo:${NC}"
    echo "  cp .env.production.example .env"
    echo "  nano .env"
    exit 1
fi

echo -e "${GREEN}✅ Archivo .env encontrado${NC}"

# Verificar variables críticas
echo -e "\n${YELLOW}📋 Paso 2: Verificando variables críticas${NC}"

REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "NEXTAUTH_SECRET"
)

MISSING_VARS=()
for VAR in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${VAR}=" .env; then
        MISSING_VARS+=("$VAR")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Faltan las siguientes variables en .env:${NC}"
    for VAR in "${MISSING_VARS[@]}"; do
        echo "  - $VAR"
    done
    exit 1
fi

echo -e "${GREEN}✅ Variables críticas presentes${NC}"

# Parar contenedores actuales
echo -e "\n${YELLOW}📋 Paso 3: Deteniendo contenedores actuales${NC}"
docker-compose stop || true
echo -e "${GREEN}✅ Contenedores detenidos${NC}"

# Eliminar contenedores y red (manejando nginx externo)
echo -e "\n${YELLOW}📋 Paso 4: Limpiando contenedores antiguos${NC}"
docker-compose down --remove-orphans || true
echo -e "${GREEN}✅ Contenedores eliminados${NC}"

# Limpiar imágenes antiguas (opcional - comentado por defecto)
# echo -e "\n${YELLOW}📋 Paso 5: Limpiando imágenes antiguas (opcional)${NC}"
# docker image prune -f
# echo -e "${GREEN}✅ Imágenes antiguas eliminadas${NC}"

# Build con no-cache para forzar rebuild completo
echo -e "\n${YELLOW}📋 Paso 5: Construyendo nueva imagen${NC}"
echo -e "${YELLOW}⏳ Esto puede tardar varios minutos...${NC}"
docker-compose build --no-cache
echo -e "${GREEN}✅ Imagen construida${NC}"

# Levantar servicios
echo -e "\n${YELLOW}📋 Paso 6: Levantando servicios${NC}"
docker-compose up -d
echo -e "${GREEN}✅ Servicios levantados${NC}"

# Esperar a que la app esté lista
echo -e "\n${YELLOW}📋 Paso 7: Esperando que la aplicación esté lista${NC}"
echo -e "${YELLOW}⏳ Esperando 10 segundos...${NC}"
sleep 10

# Verificar que el contenedor está corriendo
echo -e "\n${YELLOW}📋 Paso 8: Verificando estado de contenedores${NC}"
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Contenedores corriendo correctamente${NC}"
    
    # Mostrar logs recientes
    echo -e "\n${YELLOW}📋 Últimos logs de la aplicación:${NC}"
    docker-compose logs --tail=20 nextjs-app
    
    echo -e "\n${GREEN}================================================${NC}"
    echo -e "${GREEN}✅ DEPLOYMENT COMPLETADO EXITOSAMENTE${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo -e "🌐 La aplicación debería estar disponible en:"
    echo -e "   http://localhost:3000 (local)"
    echo -e "   http://tu-dominio.com (si nginx está configurado)"
    echo ""
    echo -e "📊 Para ver logs en tiempo real:"
    echo -e "   docker-compose logs -f nextjs-app"
    echo ""
    echo -e "🔄 Para reiniciar:"
    echo -e "   docker-compose restart nextjs-app"
    echo ""
else
    echo -e "${RED}❌ Error: Los contenedores no están corriendo correctamente${NC}"
    echo -e "\n${YELLOW}Mostrando logs para diagnóstico:${NC}"
    docker-compose logs --tail=50 nextjs-app
    exit 1
fi
