#!/bin/bash

# Script para añadir la configuración faltante específica para redirección automática
echo "🔧 CONFIGURACIÓN ESPECÍFICA PARA REDIRECCIÓN AUTOMÁTICA"
echo "=" * 60
echo ""

echo "📋 PROBLEMA IDENTIFICADO:"
echo "En docker-compose.yml está mapeado:"
echo "  GOTRUE_SITE_URL: \${SITE_URL}"
echo "  GOTRUE_URI_ALLOW_LIST: \${ADDITIONAL_REDIRECT_URLS}"
echo ""

echo "Pero falta la configuración que habilita la redirección automática."
echo ""

echo "➕ AÑADIENDO CONFIGURACIÓN FALTANTE AL ARCHIVO .ENV..."

# Ir al directorio correcto
cd /root/supabase-automated-self-host/docker || {
    echo "❌ Error: No se pudo acceder al directorio de Supabase"
    exit 1
}

# Hacer backup
echo "📂 Creando backup..."
cp .env .env.backup.redirect.$(date +%Y%m%d_%H%M%S)

# Verificar si ya existe la configuración
if grep -q "GOTRUE_EXTERNAL_REDIRECT_ENABLED" .env; then
    echo "✅ GOTRUE_EXTERNAL_REDIRECT_ENABLED ya existe"
else
    echo "➕ Añadiendo GOTRUE_EXTERNAL_REDIRECT_ENABLED..."
    echo "" >> .env
    echo "# GoTrue Redirect Configuration" >> .env
    echo "GOTRUE_EXTERNAL_REDIRECT_ENABLED=true" >> .env
fi

# Verificar otras configuraciones útiles
if grep -q "GOTRUE_MAILER_AUTOCONFIRM_REDIRECTS" .env; then
    echo "✅ GOTRUE_MAILER_AUTOCONFIRM_REDIRECTS ya existe"
else
    echo "➕ Añadiendo GOTRUE_MAILER_AUTOCONFIRM_REDIRECTS..."
    echo "GOTRUE_MAILER_AUTOCONFIRM_REDIRECTS=true" >> .env
fi

echo ""
echo "📋 VERIFICANDO CONFIGURACIONES AÑADIDAS:"
echo "Últimas líneas del archivo .env:"
tail -5 .env

echo ""
echo "✅ CONFIGURACIONES AÑADIDAS CORRECTAMENTE"
echo ""
echo "⚡ PRÓXIMO PASO - REINICIAR SUPABASE:"
echo "docker-compose down && docker-compose up -d"
echo ""
echo "🧪 DESPUÉS DE REINICIAR, PROBAR:"
echo "1. Solicitar nuevo reset password"
echo "2. El enlace debería redirigir automáticamente"
echo ""
echo "📋 SI SIGUE SIN FUNCIONAR:"
echo "Usar la URL manual que ya funciona:"
echo "https://lacasadelsueloradiante.es/auth/reset-password?token=XXX&type=recovery"