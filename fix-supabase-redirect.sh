#!/bin/bash

# Script para corregir la configuración de redirección automática en Supabase
# Ejecutar en el servidor VPS

echo "🔧 CORRECCIÓN DE REDIRECCIÓN AUTOMÁTICA EN SUPABASE"
echo "=" * 60
echo ""

echo "📂 Cambiando al directorio de Supabase..."
cd /root/supabase-automated-self-host/docker || {
    echo "❌ Error: No se pudo acceder al directorio de Supabase"
    exit 1
}

echo "✅ Directorio correcto: $(pwd)"
echo ""

echo "📝 Realizando backup del archivo .env actual..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup creado"

echo ""
echo "🛠️ CONFIGURACIONES ADICIONALES NECESARIAS:"
echo ""

# Verificar y agregar configuraciones faltantes
echo "1️⃣ Verificando configuración de CORS..."

# Comprobar si existe la configuración CORS
if ! grep -q "GOTRUE_EXTERNAL_" .env; then
    echo "➕ Añadiendo configuraciones de GoTrue..."
    cat >> .env << 'EOF'

# GoTrue (Auth Service) Additional Config
GOTRUE_EXTERNAL_REDIRECT_URL=https://lacasadelsueloradiante.es/auth/reset-password
GOTRUE_SITE_URL=https://lacasadelsueloradiante.es
GOTRUE_URI_ALLOW_LIST=https://lacasadelsueloradiante.es/**
GOTRUE_REDIRECT_HOST=lacasadelsueloradiante.es
GOTRUE_CORS_ALLOWED_ORIGINS=https://lacasadelsueloradiante.es,https://supabase.lacasadelsueloradianteapp.com

EOF
    echo "✅ Configuraciones GoTrue añadidas"
else
    echo "✅ Configuraciones GoTrue ya existen"
fi

echo ""
echo "2️⃣ Verificando configuración de MAILER..."

# Actualizar configuración de mailer si es necesario
if grep -q "MAILER_AUTOCONFIRM" .env; then
    echo "✅ Configuración de mailer ya existe"
else
    echo "➕ Añadiendo configuraciones de Mailer..."
    cat >> .env << 'EOF'

# Mailer Additional Config
MAILER_AUTOCONFIRM=false
MAILER_SECURE_EMAIL_CHANGE_ENABLED=true
MAILER_OTP_EXP=3600
MAILER_OTP_LENGTH=6

EOF
    echo "✅ Configuraciones de Mailer añadidas"
fi

echo ""
echo "3️⃣ Verificando configuración de AUTH..."

# Verificar configuración específica de Auth
if ! grep -q "GOTRUE_DISABLE_SIGNUP" .env; then
    echo "➕ Añadiendo configuraciones Auth específicas..."
    sed -i 's/DISABLE_SIGNUP=false/GOTRUE_DISABLE_SIGNUP=false/' .env
    cat >> .env << 'EOF'

# Auth Flow Config
GOTRUE_ENABLE_REDIRECT=true
GOTRUE_REDIRECT_TIMEOUT=60
GOTRUE_EXTERNAL_EMAIL_ENABLED=true
GOTRUE_EXTERNAL_PHONE_ENABLED=true

EOF
    echo "✅ Configuraciones Auth específicas añadidas"
else
    echo "✅ Configuraciones Auth específicas ya existen"
fi

echo ""
echo "📋 RESUMEN DE CAMBIOS APLICADOS:"
echo "• GOTRUE_EXTERNAL_REDIRECT_URL configurada"
echo "• GOTRUE_SITE_URL actualizada"
echo "• GOTRUE_URI_ALLOW_LIST configurada"
echo "• GOTRUE_CORS_ALLOWED_ORIGINS configurada"
echo "• Configuraciones de Mailer actualizadas"
echo "• Configuraciones de Auth Flow habilitadas"

echo ""
echo "4️⃣ Reiniciando servicios para aplicar cambios..."
docker-compose down
sleep 5
docker-compose up -d

echo ""
echo "⏱️ Esperando que los servicios se inicien..."
sleep 15

echo ""
echo "5️⃣ Verificando estado de los servicios..."
docker-compose ps

echo ""
echo "📋 VERIFICAR LOGS SI HAY PROBLEMAS:"
echo "docker-compose logs auth"
echo "docker-compose logs kong"

echo ""
echo "✅ CONFIGURACIÓN COMPLETADA"
echo ""
echo "🧪 PROBAR AHORA:"
echo "1. Solicitar nuevo reset password"
echo "2. El enlace del email debería redirigir automáticamente"
echo "3. Si no, usar el workaround manual con la URL correcta"