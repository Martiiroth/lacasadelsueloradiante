#!/bin/bash

# ============================================================================
# CONFIGURAR TEMPLATES PERSONALIZADOS DE EMAIL EN SUPABASE
# ============================================================================

echo "📧 CONFIGURANDO TEMPLATES PERSONALIZADOS DE EMAIL"
echo ""

echo "📋 PASOS PARA ACTIVAR LOS TEMPLATES:"
echo ""

echo "1. 📁 CREAR DIRECTORIO EN EL SERVIDOR:"
echo "   ssh root@tu-servidor"
echo "   mkdir -p /var/www/email-templates"
echo ""

echo "2. 📤 SUBIR LOS TEMPLATES AL SERVIDOR:"
echo "   # Desde tu máquina local, subir los templates:"
echo "   scp email-templates/*.html root@tu-servidor:/var/www/email-templates/"
echo ""

echo "3. 🔧 ACTUALIZAR EL .ENV CON LAS URLS DE LOS TEMPLATES:"
echo "   # En el servidor, editar el .env:"
echo "   cd ~/supabase-automated-self-host/docker"
echo "   nano .env"
echo ""

echo "   # Añadir estas líneas (URLs públicas a los templates):"
echo "   MAILER_TEMPLATES_INVITE=https://lacasadelsueloradiante.es/email-templates/invite-template.html"
echo "   MAILER_TEMPLATES_CONFIRMATION=https://lacasadelsueloradiante.es/email-templates/confirmation-template.html"
echo "   MAILER_TEMPLATES_RECOVERY=https://lacasadelsueloradiante.es/email-templates/recovery-template.html"
echo "   MAILER_TEMPLATES_MAGIC_LINK=https://lacasadelsueloradiante.es/email-templates/recovery-template.html"
echo ""

echo "4. 🌐 SERVIR LOS TEMPLATES VÍA NGINX:"
echo "   # Añadir al nginx.conf o crear archivo específico:"
echo ""
echo "   location /email-templates/ {"
echo "       alias /var/www/email-templates/;"
echo "       expires 1d;"
echo "       add_header Cache-Control \"public, no-transform\";"
echo "   }"
echo ""

echo "5. 🔄 REINICIAR SERVICIOS:"
echo "   # Reiniciar nginx"
echo "   nginx -t && systemctl reload nginx"
echo ""
echo "   # Reiniciar Supabase"
echo "   docker-compose down"
echo "   docker-compose up -d"
echo ""

echo "6. 🧪 PROBAR LOS TEMPLATES:"
echo "   # Verificar que los templates se sirven correctamente:"
echo "   curl -I https://lacasadelsueloradiante.es/email-templates/recovery-template.html"
echo ""
echo "   # Probar envío de email de recuperación:"
echo "   curl -X POST \"https://supabase.lacasadelsueloradianteapp.com/auth/v1/recover\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -H \"apikey: \$ANON_KEY\" \\"
echo "     -d '{\"email\": \"djmartiiservicios@gmail.com\"}'"
echo ""

echo "📝 CONFIGURACIÓN FINAL PARA EL .ENV:"
echo ""
cat << 'EOF'
# ✅ TEMPLATES PERSONALIZADOS DE EMAIL
MAILER_TEMPLATES_INVITE=https://lacasadelsueloradiante.es/email-templates/invite-template.html
MAILER_TEMPLATES_CONFIRMATION=https://lacasadelsueloradiante.es/email-templates/confirmation-template.html
MAILER_TEMPLATES_RECOVERY=https://lacasadelsueloradiante.es/email-templates/recovery-template.html
MAILER_TEMPLATES_MAGIC_LINK=https://lacasadelsueloradiante.es/email-templates/recovery-template.html
MAILER_TEMPLATES_EMAIL_CHANGE=

# ✅ SUJETOS DE EMAIL PERSONALIZADOS
MAILER_SUBJECTS_INVITE=Te han invitado a La Casa del Suelo Radiante
MAILER_SUBJECTS_CONFIRMATION=Confirma tu registro en La Casa del Suelo Radiante
MAILER_SUBJECTS_RECOVERY=Recupera tu contraseña - La Casa del Suelo Radiante
MAILER_SUBJECTS_MAGIC_LINK=Tu enlace de acceso - La Casa del Suelo Radiante
MAILER_SUBJECTS_EMAIL_CHANGE=Confirma el cambio de email - La Casa del Suelo Radiante

# ✅ NOTIFICACIONES DE CAMBIOS
MAILER_SUBJECTS_PASSWORD_CHANGED_NOTIFICATION=Tu contraseña ha sido cambiada
MAILER_SUBJECTS_EMAIL_CHANGED_NOTIFICATION=Tu email ha sido cambiado
GOTRUE_MAILER_NOTIFICATIONS_PASSWORD_CHANGED_ENABLED=true
GOTRUE_MAILER_NOTIFICATIONS_EMAIL_CHANGED_ENABLED=true
EOF

echo ""
echo "🎯 ALTERNATIVA SIMPLE (SIN NGINX):"
echo "   Si no quieres configurar nginx, puedes dejar los MAILER_TEMPLATES vacíos"
echo "   y solo usar los MAILER_SUBJECTS personalizados. GoTrue usará templates por defecto."
echo ""
echo "   MAILER_TEMPLATES_INVITE="
echo "   MAILER_TEMPLATES_CONFIRMATION="
echo "   MAILER_TEMPLATES_RECOVERY="
echo "   MAILER_TEMPLATES_MAGIC_LINK="