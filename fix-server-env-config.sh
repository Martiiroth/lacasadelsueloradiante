#!/bin/bash

# ============================================================================
# CORRECCIÓN .ENV SERVIDOR VPS - SUPABASE SELF-HOSTED
# ============================================================================
# Eliminar variables incorrectas y usar configuración correcta
# ============================================================================

echo "🔧 CORRECCIONES NECESARIAS EN EL SERVIDOR VPS:"
echo ""

echo "❌ ELIMINAR estas líneas del .env del servidor:"
echo "   GOTRUE_EXTERNAL_REDIRECT_ENABLED=true"
echo "   GOTRUE_MAILER_AUTOCONFIRM_REDIRECTS=true"
echo ""

echo "✅ VERIFICAR que estas configuraciones estén correctas:"
echo "   SITE_URL=https://lacasadelsueloradiante.es"
echo "   GOTRUE_SITE_URL=https://lacasadelsueloradiante.es"
echo "   GOTRUE_URI_ALLOW_LIST=https://lacasadelsueloradiante.es/**,https://lacasadelsueloradiante.es/auth/**"
echo "   MAILER_URLPATHS_RECOVERY=/auth/reset-password"
echo ""

echo "📧 CONFIGURACIÓN SMTP (ya está correcta):"
echo "   SMTP_HOST=mail.lacasadelsueloradiante.es"
echo "   SMTP_PORT=587"
echo "   SMTP_USER=consultas@lacasadelsueloradiante.es"
echo ""

echo "🔄 COMANDOS PARA APLICAR EN EL SERVIDOR:"
echo ""
echo "1. Conectar al servidor:"
echo "   ssh root@tu-servidor"
echo ""
echo "2. Ir al directorio de Supabase:"
echo "   cd ~/supabase-automated-self-host/docker"
echo ""
echo "3. Editar el archivo .env:"
echo "   nano .env"
echo ""
echo "4. ELIMINAR estas líneas:"
echo "   # GOTRUE_EXTERNAL_REDIRECT_ENABLED=true"
echo "   # GOTRUE_MAILER_AUTOCONFIRM_REDIRECTS=true"
echo ""
echo "5. VERIFICAR que GOTRUE_URI_ALLOW_LIST incluya:"
echo "   GOTRUE_URI_ALLOW_LIST=https://lacasadelsueloradiante.es/**,https://lacasadelsueloradiante.es/auth/**,https://lacasadelsueloradiante.es/auth/reset-password"
echo ""
echo "6. Reiniciar servicios:"
echo "   docker-compose down"
echo "   docker-compose up -d"
echo ""
echo "7. Verificar que auth esté funcionando:"
echo "   docker-compose ps"
echo "   docker logs supabase-auth"