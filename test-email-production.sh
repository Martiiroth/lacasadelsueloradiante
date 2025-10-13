#!/bin/bash

# Script para probar el sistema de email con la configuración de producción
# Uso: ./test-email-config.sh

echo "🔄 Probando configuración de email para La Casa del Suelo Radiante..."
echo ""

# Cargar variables de entorno de producción
if [ -f .env.production ]; then
    echo "📄 Cargando configuración de producción..."
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "❌ No se encontró .env.production"
    exit 1
fi

echo "📧 Configuración SMTP:"
echo "  Host: $EMAIL_HOST"
echo "  Port: $EMAIL_PORT" 
echo "  User: $EMAIL_USER"
echo "  From: $EMAIL_FROM"
echo "  Site URL: $NEXT_PUBLIC_SITE_URL"
echo ""

# Email de prueba (debe existir en Supabase Auth)
TEST_EMAIL="consultas@lacasadelsueloradiante.es"

echo "🔄 Enviando email de prueba a: $TEST_EMAIL"
echo ""

# Hacer request al API
RESPONSE=$(curl -s -X POST "$NEXT_PUBLIC_SITE_URL/api/send-reset-email" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$TEST_EMAIL\"}")

echo "📬 Respuesta del API:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

echo "✅ Test completado"
echo ""
echo "📋 Revisa:"
echo "1. La consola del servidor Next.js para logs de Nodemailer"
echo "2. Tu bandeja de entrada en consultas@lacasadelsueloradiante.es"
echo "3. La carpeta de spam por si acaso"
echo ""
echo "🔧 Si hay problemas, verifica:"
echo "1. Que el servidor mail.lacasadelsueloradiante.es esté funcionando"
echo "2. Que las credenciales EMAIL_USER/EMAIL_PASSWORD sean correctas"
echo "3. Que el puerto 587 esté abierto en tu servidor"