#!/bin/bash

echo "🔍 DIAGNÓSTICO COMPLETO SISTEMA PDF"
echo "===================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📊 1. VERIFICAR CONTENEDOR DE LA APP"
echo "--------------------------------------"
APP_CONTAINER=$(docker ps -q --filter "name=nextjs-app")
if [ -z "$APP_CONTAINER" ]; then
    echo -e "${RED}❌ Contenedor de la app NO está corriendo${NC}"
    echo "Intentando iniciar..."
    docker-compose up -d nextjs-app
    sleep 10
    APP_CONTAINER=$(docker ps -q --filter "name=nextjs-app")
else
    echo -e "${GREEN}✅ Contenedor de la app está corriendo: $APP_CONTAINER${NC}"
fi

echo ""
echo "📊 2. VERIFICAR CHROMIUM EN EL CONTENEDOR"
echo "--------------------------------------"
if [ -n "$APP_CONTAINER" ]; then
    docker exec $APP_CONTAINER which chromium-browser && echo -e "${GREEN}✅ Chromium encontrado${NC}" || echo -e "${RED}❌ Chromium NO encontrado${NC}"
    docker exec $APP_CONTAINER chromium-browser --version 2>/dev/null && echo -e "${GREEN}✅ Chromium ejecutable${NC}" || echo -e "${RED}❌ Chromium NO ejecutable${NC}"
else
    echo -e "${RED}❌ No se puede verificar, contenedor no disponible${NC}"
fi

echo ""
echo "📊 3. VERIFICAR VARIABLES DE ENTORNO PUPPETEER"
echo "--------------------------------------"
if [ -n "$APP_CONTAINER" ]; then
    echo "PUPPETEER_EXECUTABLE_PATH:"
    docker exec $APP_CONTAINER env | grep PUPPETEER || echo -e "${YELLOW}⚠️  Variables PUPPETEER no configuradas${NC}"
    echo ""
    echo "NODE_ENV:"
    docker exec $APP_CONTAINER env | grep NODE_ENV
fi

echo ""
echo "📊 4. PROBAR API DE TEST-PDF"
echo "--------------------------------------"
curl -s -w "\nHTTP Status: %{http_code}\n" https://lacasadelsueloradianteapp.com/api/test-pdf | head -50

echo ""
echo "📊 5. VER LOGS DE LA APLICACIÓN (Puppeteer)"
echo "--------------------------------------"
if [ -n "$APP_CONTAINER" ]; then
    echo "Buscando logs de Puppeteer/PDF..."
    docker logs $APP_CONTAINER 2>&1 | grep -E "PDF|Puppeteer|chromium|Browser" | tail -20
else
    echo -e "${RED}❌ No se pueden obtener logs${NC}"
fi

echo ""
echo "📊 6. PROBAR DESCARGA DE PDF ESPECÍFICO"
echo "--------------------------------------"
echo "Probando descarga de factura 21dd777a-ff0c-40c6-9f65-a880f38f43f0..."
HTTP_CODE=$(curl -s -o /tmp/test-invoice.pdf -w "%{http_code}" https://lacasadelsueloradianteapp.com/api/invoices/21dd777a-ff0c-40c6-9f65-a880f38f43f0/pdf)
echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" == "200" ]; then
    FILE_SIZE=$(stat -f%z /tmp/test-invoice.pdf 2>/dev/null || stat -c%s /tmp/test-invoice.pdf 2>/dev/null)
    if [ "$FILE_SIZE" -gt 1000 ]; then
        echo -e "${GREEN}✅ PDF descargado correctamente: $FILE_SIZE bytes${NC}"
        file /tmp/test-invoice.pdf
    else
        echo -e "${YELLOW}⚠️  PDF muy pequeño: $FILE_SIZE bytes${NC}"
        echo "Contenido:"
        cat /tmp/test-invoice.pdf | head -20
    fi
else
    echo -e "${RED}❌ Error en descarga, código: $HTTP_CODE${NC}"
    echo "Respuesta del servidor:"
    curl -s https://lacasadelsueloradianteapp.com/api/invoices/21dd777a-ff0c-40c6-9f65-a880f38f43f0/pdf
fi

echo ""
echo "📊 7. VERIFICAR DEPENDENCIAS NPM"
echo "--------------------------------------"
if [ -n "$APP_CONTAINER" ]; then
    echo "Puppeteer instalado:"
    docker exec $APP_CONTAINER ls -la /app/node_modules/puppeteer 2>/dev/null && echo -e "${GREEN}✅ Puppeteer instalado${NC}" || echo -e "${RED}❌ Puppeteer NO instalado${NC}"
fi

echo ""
echo "📊 8. VERIFICAR MEMORIA Y RECURSOS"
echo "--------------------------------------"
if [ -n "$APP_CONTAINER" ]; then
    echo "Uso de memoria del contenedor:"
    docker stats $APP_CONTAINER --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
fi

echo ""
echo "📊 9. RESUMEN DE DIAGNÓSTICO"
echo "========================================"

if [ "$HTTP_CODE" == "200" ] && [ "$FILE_SIZE" -gt 1000 ]; then
    echo -e "${GREEN}✅ SISTEMA PDF FUNCIONANDO CORRECTAMENTE${NC}"
else
    echo -e "${RED}❌ SISTEMA PDF CON PROBLEMAS${NC}"
    echo ""
    echo "Posibles soluciones:"
    echo "1. Reiniciar contenedor: docker-compose restart nextjs-app"
    echo "2. Ver logs completos: docker logs \$(docker ps -q --filter 'name=nextjs-app') --tail=100"
    echo "3. Rebuildar contenedor: docker-compose build --no-cache nextjs-app && docker-compose up -d nextjs-app"
fi

echo ""
echo "✅ DIAGNÓSTICO COMPLETADO"
