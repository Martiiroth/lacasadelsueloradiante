#!/bin/bash

# Script para probar el sistema de recuperación de contraseñas
# Uso: ./test-password-reset.sh usuario@email.com

if [ $# -eq 0 ]; then
    echo "❌ Debes proporcionar un email"
    echo "Uso: $0 usuario@email.com"
    exit 1
fi

EMAIL="$1"
BASE_URL="${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}"

echo "🔄 Probando sistema de recuperación de contraseñas..."
echo "📧 Email: $EMAIL"
echo "🌐 URL base: $BASE_URL"
echo ""

# 1. Solicitar reset de contraseña
echo "1️⃣ Enviando solicitud de recuperación..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/send-reset-email" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$EMAIL\"}")

echo "Respuesta:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# 2. Verificar que se creó el token en la base de datos
echo "2️⃣ Verificando token en base de datos..."
if command -v psql >/dev/null 2>&1 && [ -n "$DATABASE_URL" ]; then
    psql "$DATABASE_URL" -c "
        SELECT 
            token, 
            email, 
            created_at,
            expires_at,
            used,
            (expires_at > NOW()) as valid
        FROM password_reset_tokens 
        WHERE email = '$EMAIL' 
        ORDER BY created_at DESC 
        LIMIT 1;
    "
else
    echo "⚠️ No se puede conectar a la base de datos (falta psql o DATABASE_URL)"
fi

echo ""
echo "✅ Test completado"
echo ""
echo "📋 Pasos siguientes:"
echo "1. Revisa tu email para el enlace de recuperación"
echo "2. Haz clic en el enlace para probar el cambio de contraseña"
echo "3. Verifica que el token se marca como 'usado' después del cambio"