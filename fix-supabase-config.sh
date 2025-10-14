#!/bin/bash

echo "🔧 CONFIGURACIÓN REQUERIDA PARA SUPABASE SELF-HOSTED"
echo "=" $(printf "%0.s=" {1..60})
echo ""

echo "📁 Archivo a editar:"
echo "   /root/supabase-automated-self-host/docker/.env"
echo ""

echo "🛠️ CAMBIOS NECESARIOS:"
echo ""

echo "1️⃣ CAMBIAR esta línea:"
echo "   ADICIONAL_REDIRECT_URLS="
echo ""
echo "   ✅ POR ESTA:"
echo "   ADDITIONAL_REDIRECT_URLS=https://lacasadelsueloradiante.es/**,https://lacasadelsueloradiante.es/auth/**,https://lacasadelsueloradiante.es/auth/reset-password"
echo ""

echo "2️⃣ VERIFICAR que estas líneas estén correctas:"
echo "   ✅ SITE_URL=https://lacasadelsueloradiante.es"
echo "   ✅ MAILER_URLPATHS_RECOVERY=/auth/reset-password"
echo "   ✅ SMTP_HOST=mail.lacasadelsueloradiante.es"
echo "   ✅ SMTP_PORT=587"
echo "   ✅ SMTP_USER=consultas@lacasadelsueloradiante.es"
echo ""

echo "📋 COMANDOS PARA APLICAR:"
echo ""
echo "# 1. Editar archivo"
echo "nano /root/supabase-automated-self-host/docker/.env"
echo ""
echo "# 2. Reiniciar servicios"
echo "cd /root/supabase-automated-self-host/docker"
echo "docker-compose down"
echo "docker-compose up -d"
echo ""
echo "# 3. Verificar estado"
echo "docker-compose ps"
echo ""

echo "🎯 RESULTADO ESPERADO:"
echo "Después de estos cambios, el enlace del email te llevará directamente a:"
echo "https://lacasadelsueloradiante.es/auth/reset-password?access_token=XXX&refresh_token=YYY"
echo ""

echo "⚡ PARA PROBAR:"
echo "1. Aplicar los cambios"
echo "2. Reiniciar Supabase"
echo "3. Solicitar nuevo reset de contraseña"
echo "4. El enlace del email debería funcionar correctamente"