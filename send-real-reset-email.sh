#!/bin/bash

# Script para enviar email de recuperación usando el API real de Next.js
# Esto creará tokens válidos en la base de datos

echo "🚀 Iniciando servidor Next.js y enviando email con token real..."
echo ""

# Verificar que el servidor esté corriendo
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "⚠️  El servidor Next.js no está corriendo."
    echo "   Iniciando servidor..."
    pnpm dev &
    SERVER_PID=$!
    
    echo "   Esperando que el servidor se inicie..."
    sleep 8
    
    # Verificar nuevamente
    if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "❌ No se pudo iniciar el servidor"
        kill $SERVER_PID 2>/dev/null
        exit 1
    fi
    
    echo "✅ Servidor iniciado exitosamente"
else
    echo "✅ Servidor Next.js ya está corriendo"
fi

echo ""
echo "📧 Enviando email de recuperación a javipablo0408@gmail.com..."
echo "   (Esto creará un token REAL en la base de datos)"

# Enviar request al API
RESPONSE=$(curl -s -X POST "http://localhost:3000/api/send-reset-email" \
    -H "Content-Type: application/json" \
    -d '{"email": "javipablo0408@gmail.com"}')

echo ""
echo "📬 Respuesta del API:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "✅ Proceso completado"
echo ""
echo "📋 Instrucciones:"
echo "1. Revisa tu Gmail: javipablo0408@gmail.com"
echo "2. Busca el email de 'La Casa del Suelo Radiante'" 
echo "3. Haz clic en el enlace para restablecer contraseña"
echo "4. El token ahora debería ser válido y funcionar correctamente"
echo ""
echo "🔧 Si el servidor sigue corriendo en background:"
echo "   Puedes detenerlo con: pkill -f 'next dev'"