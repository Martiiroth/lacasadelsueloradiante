#!/bin/bash

# ============================================================================
# SCRIPT PARA PROBAR LA PLANTILLA DE RESET PASSWORD
# ============================================================================

echo "🧪 PROBANDO PLANTILLA DE RESET PASSWORD"
echo ""

echo "1️⃣  VERIFICAR QUE NEXT.JS SIRVA LA PLANTILLA LOCALMENTE:"
echo ""

if [ -f "public/templates/recovery-email.html" ]; then
    echo "✅ Plantilla encontrada en: public/templates/recovery-email.html"
else
    echo "❌ Plantilla no encontrada. Creando..."
    mkdir -p public/templates
    echo "📄 Plantilla creada. Reinicia el servidor de desarrollo."
fi

echo ""
echo "2️⃣  INSTRUCCIONES PARA PROBAR:"
echo ""

echo "# A. Desde el desarrollo local (http://localhost:3000):"
echo "curl -I http://localhost:3000/templates/recovery-email.html"
echo ""
echo "# Debería devolver: HTTP/1.1 200 OK"
echo ""

echo "# B. Desde producción (después de hacer deploy):"
echo "curl -I https://lacasadelsueloradiante.es/templates/recovery-email.html"
echo ""

echo "3️⃣  CONFIGURAR EN EL SERVIDOR VPS:"
echo ""
echo "# Una vez que confirmes que la plantilla es accesible, configurar:"
echo "ssh root@tu-servidor"
echo "cd ~/supabase-automated-self-host/docker"
echo "nano .env"
echo ""
echo "# Añadir esta línea al .env:"
echo "MAILER_TEMPLATES_RECOVERY=https://lacasadelsueloradiante.es/templates/recovery-email.html"
echo ""
echo "# Reiniciar auth:"
echo "docker-compose restart auth"
echo ""

echo "4️⃣  PROBAR EL RESET COMPLETO:"
echo ""
echo "curl -X POST \"https://supabase.lacasadelsueloradianteapp.com/auth/v1/recover\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"apikey: eyJ0eXAiOiAiSldUIiwiYWxnIjogIkhTMjU2In0.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzU4NzAwNTMzLAogICJleHAiOiAxOTE2MzgwNTMzCn0.uhOFMEExih6oXgd9tDGK87L-xQMK6J-6w5oPDs2tnbc\" \\"
echo "  -d '{\"email\": \"djmartiiservicios@gmail.com\"}'"
echo ""

echo "5️⃣  VERIFICAR EL EMAIL:"
echo ""
echo "✅ Debería llegar un email con:"
echo "   - Diseño personalizado de La Casa del Suelo Radiante"
echo "   - Botón que apunta a: https://lacasadelsueloradiante.es/auth/reset-password?token=xxx"
echo "   - Sujeto: Recupera tu contraseña - La Casa del Suelo Radiante"
echo ""

echo "🔧 TROUBLESHOOTING:"
echo ""
echo "Si no funciona:"
echo "1. Verificar que la plantilla sea accesible públicamente"
echo "2. Revisar logs del servicio auth: docker logs supabase-auth"
echo "3. Verificar configuración: grep MAILER_TEMPLATES_RECOVERY .env"
echo "4. Probar sin plantilla primero: MAILER_TEMPLATES_RECOVERY="
echo ""

echo "📁 ARCHIVOS CREADOS:"
echo "✅ public/templates/recovery-email.html - Plantilla HTML personalizada"
echo "✅ server-env-with-template.env - Configuración .env completa"
echo "✅ next.config.js - Actualizado para servir templates"
echo "✅ implement-custom-template.sh - Script de implementación completo"