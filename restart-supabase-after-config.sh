#!/bin/bash

# Script para reiniciar Supabase después de cambios en configuración
# Ejecutar en el servidor VPS

echo "🔧 REINICIANDO SUPABASE DESPUÉS DE CAMBIOS DE CONFIGURACIÓN"
echo "=" * 60
echo ""

echo "📍 Ubicación actual: $(pwd)"
echo "📂 Cambiando al directorio de Supabase..."

cd /root/supabase-automated-self-host/docker || {
    echo "❌ Error: No se pudo acceder al directorio de Supabase"
    exit 1
}

echo "✅ Directorio correcto: $(pwd)"
echo ""

echo "1️⃣ Deteniendo servicios de Supabase..."
docker-compose down

echo ""
echo "2️⃣ Iniciando servicios con nueva configuración..."
docker-compose up -d

echo ""
echo "3️⃣ Verificando estado de los servicios..."
sleep 10
docker-compose ps

echo ""
echo "4️⃣ Verificando logs de GoTrue (Auth)..."
echo "Últimas líneas de logs del servicio de autenticación:"
docker-compose logs --tail=10 auth

echo ""
echo "✅ REINICIO COMPLETADO"
echo ""
echo "🔗 URLs para verificar:"
echo "   Dashboard: https://supabase.lacasadelsueloradianteapp.com"
echo "   API: https://supabase.lacasadelsueloradianteapp.com/rest/v1/"
echo ""
echo "🧪 Probar recuperación de contraseña:"
echo "   1. Ir a: https://lacasadelsueloradiante.es/auth/forgot-password"
echo "   2. Introducir email: djmartiiservicios@gmail.com"
echo "   3. Verificar que el enlace del email apunte a lacasadelsueloradiante.es"
echo ""
echo "📋 Si hay problemas, verificar logs con:"
echo "   docker-compose logs auth"
echo "   docker-compose logs kong"