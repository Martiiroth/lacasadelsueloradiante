#!/bin/bash

# =======================================================
# Script de diagnóstico de email para VPS
# =======================================================

echo "🔍 DIAGNÓSTICO DE EMAIL EN VPS"
echo "================================"

echo "1️⃣ Verificando variables de entorno..."
echo "EMAIL_USER: ${EMAIL_USER:-'❌ NO DEFINIDA'}"
echo "EMAIL_PASSWORD: ${EMAIL_PASSWORD:+✅ DEFINIDA}"
echo "EMAIL_FROM_NAME: ${EMAIL_FROM_NAME:-'❌ NO DEFINIDA'}"
echo "EMAIL_FROM_ADDRESS: ${EMAIL_FROM_ADDRESS:-'❌ NO DEFINIDA'}"
echo "EMAIL_ADMIN_ADDRESS: ${EMAIL_ADMIN_ADDRESS:-'❌ NO DEFINIDA'}"

echo ""
echo "2️⃣ Probando conectividad con Zoho SMTP..."
# Test básico de conectividad
timeout 10 bash -c "</dev/tcp/smtppro.zoho.eu/465" && echo "✅ Puerto 465 accesible" || echo "❌ Puerto 465 no accesible"

echo ""
echo "3️⃣ Probando endpoint de diagnóstico..."
if command -v curl >/dev/null 2>&1; then
    echo "Haciendo petición a /api/test-email..."
    curl -s -X GET http://localhost:3000/api/test-email | head -200
else
    echo "❌ curl no disponible"
fi

echo ""
echo "4️⃣ Verificando logs del contenedor..."
echo "Últimas líneas de logs relacionadas con email:"
docker-compose logs nextjs-app 2>/dev/null | grep -i "email\|smtp\|📧\|❌\|✅" | tail -10

echo ""
echo "5️⃣ Verificando configuración de red..."
echo "Comprobando conectividad externa desde el contenedor:"
docker-compose exec nextjs-app ping -c 2 smtppro.zoho.eu 2>/dev/null || echo "❌ No se puede resolver smtppro.zoho.eu"

echo ""
echo "================================"
echo "💡 SUGERENCIAS:"
echo "- Si las variables están definidas pero no funcionan, reinicia el contenedor"
echo "- Si el puerto 465 no es accesible, verifica el firewall del VPS"
echo "- Si smtppro.zoho.eu no resuelve, prueba con smtppro.zoho.com"
echo "- Revisa los logs completos con: docker-compose logs nextjs-app"