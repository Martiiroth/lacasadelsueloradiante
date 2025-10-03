#!/bin/bash

# Guía completa para configurar dominio en VPS
echo "🌐 CONFIGURACIÓN DE DOMINIO PARA PRODUCCIÓN"
echo "==========================================="

echo ""
echo "📋 PASOS PARA CONFIGURAR lacasadelsueloradianteapp.com:"
echo ""

echo "1️⃣ CONFIGURACIÓN DNS (en tu proveedor de dominio):"
echo "   • Crear registro A: lacasadelsueloradianteapp.com → IP_DEL_VPS"
echo "   • Crear registro A: www.lacasadelsueloradianteapp.com → IP_DEL_VPS"
echo ""

echo "2️⃣ CONFIGURAR NGINX EN EL VPS:"
echo "   • Crear configuración de nginx"
echo "   • Obtener certificado SSL con Let's Encrypt"
echo ""

echo "3️⃣ HABILITAR NGINX EN DOCKER:"
echo "   • Descomentar sección nginx en docker-compose.yml"
echo "   • Mapear puertos 80 y 443"
echo ""

echo "4️⃣ SOLUCIÓN RÁPIDA - USAR LOCALHOST MIENTRAS TANTO:"
echo ""
echo "# En el VPS, crear archivo .env.production con localhost:"
echo "cp .env.production.localhost .env.production"
echo ""
echo "# Hacer deployment:"
echo "docker-compose down"
echo "docker-compose build --no-cache"
echo "docker-compose up -d"
echo ""
echo "# Probar en: http://IP_DEL_VPS:3000"
echo ""

echo "5️⃣ VERIFICAR IP DEL VPS:"
echo "curl ifconfig.me"
echo ""

echo "🎯 COMANDOS PARA EL VPS (solución inmediata):"
echo "============================================="
echo ""
echo "# 1. Crear configuración localhost"
echo 'cat > .env.production << EOF'
echo 'NODE_ENV=production'
echo 'NEXTAUTH_URL=http://localhost:3000'
echo 'NEXT_PUBLIC_APP_URL=http://localhost:3000'  
echo 'NEXT_PUBLIC_API_URL=http://localhost:3000/api'
echo 'NEXT_PUBLIC_SITE_URL=http://localhost:3000'
echo '# ... resto de variables igual ...'
echo 'EOF'
echo ""
echo "# 2. Deployment"
echo "docker-compose down && docker-compose build --no-cache && docker-compose up -d"
echo ""
echo "# 3. Ver logs"
echo "docker-compose logs -f nextjs-app"