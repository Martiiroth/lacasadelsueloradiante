#!/bin/bash

# Script para añadir las configuraciones GoTrue faltantes al archivo .env
echo "🔧 AÑADIENDO CONFIGURACIONES GOTRUE FALTANTES"
echo "=" * 60
echo ""

# Hacer backup
echo "📂 Creando backup del archivo .env actual..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup creado"

# Añadir las configuraciones al final del archivo
echo ""
echo "➕ Añadiendo configuraciones GoTrue al archivo .env..."

cat >> .env << 'EOF'

############
# GoTrue Redirect Configuration
############
GOTRUE_SITE_URL=https://lacasadelsueloradiante.es
GOTRUE_URI_ALLOW_LIST=https://lacasadelsueloradiante.es/**,https://supabase.lacasadelsueloradianteapp.com/**
GOTRUE_EXTERNAL_EMAIL_ENABLED=true
GOTRUE_EXTERNAL_PHONE_ENABLED=true
GOTRUE_DISABLE_SIGNUP=false
GOTRUE_ENABLE_REDIRECT=true
GOTRUE_REDIRECT_TIMEOUT=120
GOTRUE_CORS_ALLOWED_ORIGINS=https://lacasadelsueloradiante.es,https://supabase.lacasadelsueloradianteapp.com

############
# Mailer Extended Configuration
############
MAILER_AUTOCONFIRM=false
MAILER_SECURE_EMAIL_CHANGE_ENABLED=true
MAILER_OTP_EXP=3600
MAILER_OTP_LENGTH=6

EOF

echo "✅ Configuraciones añadidas exitosamente"
echo ""
echo "📋 Se han añadido las siguientes configuraciones:"
echo "• GOTRUE_SITE_URL"
echo "• GOTRUE_URI_ALLOW_LIST"  
echo "• GOTRUE_EXTERNAL_EMAIL_ENABLED"
echo "• GOTRUE_EXTERNAL_PHONE_ENABLED"
echo "• GOTRUE_DISABLE_SIGNUP"
echo "• GOTRUE_ENABLE_REDIRECT"
echo "• GOTRUE_REDIRECT_TIMEOUT"
echo "• GOTRUE_CORS_ALLOWED_ORIGINS"
echo "• MAILER_AUTOCONFIRM"
echo "• MAILER_SECURE_EMAIL_CHANGE_ENABLED"
echo "• MAILER_OTP_EXP"
echo "• MAILER_OTP_LENGTH"

echo ""
echo "🔍 Verificando el archivo final..."
tail -15 .env

echo ""
echo "⚡ PRÓXIMO PASO:"
echo "Reiniciar Supabase para aplicar los cambios:"
echo "docker-compose down && docker-compose up -d"