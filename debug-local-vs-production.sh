#!/bin/bash

# Diagnóstico de diferencias Local vs Producción
echo "🔍 DIAGNÓSTICO: ¿Por qué falla en producción si funciona en local?"
echo "=================================================================="

echo ""
echo "📋 PRINCIPALES DIFERENCIAS LOCAL vs PRODUCCIÓN:"
echo ""

echo "1️⃣ MODO DE EJECUCIÓN:"
echo "   • Local:      pnpm dev (Next.js development)"
echo "   • Producción: Docker container (Next.js standalone)"
echo ""

echo "2️⃣ VARIABLES DE ENTORNO:"
echo "   • Local:      .env.local"
echo "   • Producción: .env.production + build-time vars"
echo ""

echo "3️⃣ RED Y DNS:"
echo "   • Local:      Acceso directo desde tu máquina"
echo "   • Producción: Dentro de container Docker (red aislada)"
echo ""

echo "4️⃣ COMPILACIÓN:"
echo "   • Local:      Compilación en tiempo real"
echo "   • Producción: Build estático optimizado"
echo ""

echo "🔧 PROBLEMAS COMUNES Y SOLUCIONES:"
echo ""

echo "❌ PROBLEMA 1: URL de Supabase no accesible desde container"
echo "   ✅ SOLUCIÓN: Verificar DNS interno del container"
echo "   🔧 TEST: docker run --rm alpine nslookup supabase.lacasadelsueloradianteapp.com"
echo ""

echo "❌ PROBLEMA 2: Variables de entorno no pasadas al build"
echo "   ✅ SOLUCIÓN: Verificar Dockerfile ARG vs ENV"
echo "   🔧 TEST: Ver variables en container"
echo ""

echo "❌ PROBLEMA 3: Next.js optimizaciones de producción"
echo "   ✅ SOLUCIÓN: Logs más detallados en producción"
echo "   🔧 TEST: Añadir debug logs en APIs"
echo ""

echo "❌ PROBLEMA 4: Diferencias en módulos Node.js"
echo "   ✅ SOLUCIÓN: Build limpio, versiones correctas"
echo "   🔧 TEST: Verificar package.json lock"
echo ""

echo "❌ PROBLEMA 5: Puertos y conectividad"
echo "   ✅ SOLUCIÓN: Verificar mapeo de puertos Docker"
echo "   🔧 TEST: curl localhost:3000 desde host"
echo ""

echo "🚨 PROBLEMA MÁS COMÚN:"
echo "   La URL personalizada de Supabase funciona desde tu máquina"
echo "   pero NO desde dentro del container Docker por DNS/Firewall"

# Tests que podemos hacer
echo ""
echo "🧪 TESTS PARA IDENTIFICAR EL PROBLEMA:"
echo ""
echo "1. Test DNS desde container:"
echo "   docker run --rm alpine nslookup supabase.lacasadelsueloradianteapp.com"
echo ""
echo "2. Test conectividad desde container:"
echo "   docker run --rm alpine wget -qO- https://supabase.lacasadelsueloradianteapp.com"
echo ""
echo "3. Test variables en build:"
echo "   docker-compose build --no-cache; docker-compose run --rm nextjs-app env | grep SUPABASE"
echo ""
echo "4. Test aplicación sin Docker:"
echo "   NODE_ENV=production pnpm build && pnpm start"
echo ""

echo "💡 RECOMENDACIÓN:"
echo "   Usar URL estándar de Supabase: https://[project-id].supabase.co"
echo "   En lugar de: https://supabase.lacasadelsueloradianteapp.com"