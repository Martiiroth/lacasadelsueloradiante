#!/bin/bash

# ============================================================================
# CONFIGURACIÓN MÍNIMA PARA RESET PASSWORD CON LINK CORRECTO
# ============================================================================

echo "🔑 CONFIGURACIÓN MÍNIMA PARA RESET PASSWORD"
echo ""

echo "🎯 OBJETIVO:"
echo "   Que el email de reset contenga: https://lacasadelsueloradiante.es/auth/reset-password?token=xxx"
echo ""

echo "✅ CONFIGURACIÓN CLAVE EN EL SERVIDOR:"
echo ""
echo "1. ELIMINAR variables inexistentes:"
echo "   ❌ GOTRUE_EXTERNAL_REDIRECT_ENABLED=true"
echo "   ❌ GOTRUE_MAILER_AUTOCONFIRM_REDIRECTS=true"
echo ""

echo "2. CONFIGURAR estas variables obligatorias:"
echo "   ✅ SITE_URL=https://lacasadelsueloradiante.es"
echo "   ✅ MAILER_URLPATHS_RECOVERY=/auth/reset-password"
echo "   ✅ ADDITIONAL_REDIRECT_URLS=https://lacasadelsueloradiante.es/**"
echo ""

echo "3. OPCIONAL - Sujeto personalizado:"
echo "   ✅ MAILER_SUBJECTS_RECOVERY=Recupera tu contraseña - La Casa del Suelo Radiante"
echo ""

echo "🚀 COMANDOS PARA APLICAR EN EL SERVIDOR:"
echo ""

echo "# 1. Conectar al servidor"
echo "ssh root@tu-servidor-ip"
echo ""

echo "# 2. Ir al directorio de Supabase"
echo "cd ~/supabase-automated-self-host/docker"
echo ""

echo "# 3. Hacer backup"
echo "cp .env .env.backup-reset-\$(date +%Y%m%d-%H%M%S)"
echo ""

echo "# 4. Editar .env y aplicar solo estos cambios:"
echo "nano .env"
echo ""
echo "# ELIMINAR estas líneas (si existen):"
echo "# GOTRUE_EXTERNAL_REDIRECT_ENABLED=true"
echo "# GOTRUE_MAILER_AUTOCONFIRM_REDIRECTS=true"
echo ""
echo "# VERIFICAR/AÑADIR estas líneas:"
echo "SITE_URL=https://lacasadelsueloradiante.es"
echo "MAILER_URLPATHS_RECOVERY=/auth/reset-password"
echo "ADDITIONAL_REDIRECT_URLS=https://lacasadelsueloradiante.es/**,https://lacasadelsueloradiante.es/auth/**"
echo "MAILER_SUBJECTS_RECOVERY=Recupera tu contraseña - La Casa del Suelo Radiante"
echo ""

echo "# 5. Reiniciar solo el servicio auth"
echo "docker-compose restart auth"
echo ""

echo "# 6. Verificar que auth está funcionando"
echo "docker logs supabase-auth --tail 10"
echo ""

echo "# 7. Probar el reset"
echo "curl -X POST \"https://supabase.lacasadelsueloradianteapp.com/auth/v1/recover\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"apikey: \${ANON_KEY}\" \\"
echo "  -d '{\"email\": \"djmartiiservicios@gmail.com\"}'"
echo ""

echo "📧 EL EMAIL DEBERÍA CONTENER:"
echo "   Asunto: Recupera tu contraseña - La Casa del Suelo Radiante"
echo "   Link: https://lacasadelsueloradiante.es/auth/reset-password?token=xxx&type=recovery"
echo ""

echo "🔍 VERIFICAR CONFIGURACIÓN ACTUAL:"
echo "grep -E 'SITE_URL|MAILER_URLPATHS_RECOVERY|ADDITIONAL_REDIRECT_URLS|GOTRUE_EXTERNAL' .env"
echo ""

echo "⚠️  IMPORTANTE:"
echo "   - NO uses templates personalizados por ahora"
echo "   - Solo cambia MAILER_URLPATHS_RECOVERY y SITE_URL"
echo "   - El docker-compose.yml ya mapea correctamente las variables"
echo ""

echo "🎯 RESULTADO ESPERADO:"
echo "   GoTrue generará automáticamente el link:"
echo "   \${SITE_URL}\${MAILER_URLPATHS_RECOVERY}?token=xxx&type=recovery"
echo "   = https://lacasadelsueloradiante.es/auth/reset-password?token=xxx&type=recovery"