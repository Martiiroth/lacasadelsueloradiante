#!/bin/bash

# Script completo para configurar dominio en VPS
echo "🌐 CONFIGURANDO DOMINIO lacasadelsueloradianteapp.com"
echo "=================================================="

echo ""
echo "📋 PASO 1: Verificar estado actual"
echo "docker ps | grep nginx"
echo "curl -I http://localhost"
echo "curl -I http://lacasadelsueloradianteapp.com"
echo ""

echo "📋 PASO 2: Actualizar variables de entorno para dominio"
echo ""
echo "# Crear .env.production con dominio real:"
echo 'cat > .env.production << EOF
NODE_ENV=production
NEXTAUTH_URL=https://lacasadelsueloradianteapp.com
NEXT_PUBLIC_APP_URL=https://lacasadelsueloradianteapp.com
NEXT_PUBLIC_API_URL=https://lacasadelsueloradianteapp.com/api
NEXT_PUBLIC_SITE_URL=https://lacasadelsueloradianteapp.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://supabase.lacasadelsueloradianteapp.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiAiSldUIiwiYWxnIjogIkhTMjU2In0.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzU4NzAwNTMzLAogICJleHAiOiAxOTE2MzgwNTMzCn0.uhOFMEExih6oXgd9tDGK87L-xQMK6J-6w5oPDs2tnbc
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiAiSldUIiwiYWxnIjogIkhTMjU2In0.ewogICJyb2xlIjogInNlcnZpY2Vfcm9sZSIsCiAgImlzcyI6ICJzdXBhYmFzZSIsCiAgImlhdCI6IDE3NTg3MDA1MzMsCiAgImV4cCI6IDE5MTYzODA1MzMKfQ.eHSEPobJlAbZtrdqPJLsG9rxtgaYIj8Gi4PItLSBjLE

# Email
EMAIL_USER=consultas@lacasadelsueloradianteapp.com
EMAIL_PASSWORD=Limpiezas-2024
EMAIL_FROM_NAME=La Casa del Suelo Radiante
EMAIL_FROM_ADDRESS=consultas@lacasadelsueloradianteapp.com
EMAIL_REPLY_TO=consultas@lacasadelsueloradianteapp.com
EMAIL_ADMIN_ADDRESS=consultas@lacasadelsueloradianteapp.com

# Business
BUSINESS_NAME=La Casa del Suelo Radiante
BUSINESS_ADDRESS=Calle de los Sistemas de Calefacción 123, 28001 Madrid, España
BUSINESS_PHONE=+34 91 123 45 67
BUSINESS_EMAIL=consultas@lacasadelsueloradianteapp.com
BUSINESS_CIF=B-87654321

NEXTAUTH_SECRET=LaCasaDelSueloRadiante2024#NextAuthSecret!Production$VPS&Secure*Hash256Bits
NEXT_TELEMETRY_DISABLED=1
EOF'
echo ""

echo "📋 PASO 3: Configurar nginx para el dominio"
echo ""
echo "# Ver configuración actual de nginx:"
echo "docker exec nginx-container ls -la /etc/nginx/"
echo "docker exec nginx-container cat /etc/nginx/nginx.conf"
echo ""

echo "📋 PASO 4: Verificar DNS del dominio"
echo "nslookup lacasadelsueloradianteapp.com"
echo "dig lacasadelsueloradianteapp.com"
echo ""

echo "📋 PASO 5: Configurar certificado SSL"
echo "# Si nginx-certbot está configurado:"
echo "docker exec nginx-container certbot --nginx -d lacasadelsueloradianteapp.com -d www.lacasadelsueloradianteapp.com"
echo ""

echo "📋 PASO 6: Rebuild y redeploy la aplicación"
echo "docker-compose down"
echo "docker-compose build --no-cache nextjs-app" 
echo "docker-compose up -d"
echo ""

echo "📋 PASO 7: Verificar funcionamiento"
echo "curl -I https://lacasadelsueloradianteapp.com"
echo "docker-compose logs -f nextjs-app"
echo ""

echo "🚨 IMPORTANTE: VERIFICAR PRIMERO:"
echo "================================="
echo ""
echo "1. ¿El DNS apunta a la IP del VPS?"
echo "   nslookup lacasadelsueloradianteapp.com"
echo ""
echo "2. ¿Nginx tiene configuración para el dominio?"
echo "   docker exec nginx-container nginx -t"
echo ""
echo "3. ¿Hay certificados SSL?"
echo "   docker exec nginx-container ls -la /etc/letsencrypt/live/"