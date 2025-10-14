#!/bin/bash

# ============================================================================
# CONFIGURACIÓN CORRECTA PARA SUPABASE CLOUD - REDIRECCIÓN EMAILS
# ============================================================================
# Este script NO es ejecutable porque las configuraciones deben hacerse 
# en el Dashboard de Supabase Cloud, no por variables de entorno
# ============================================================================

echo "🔧 CONFIGURACIÓN REQUERIDA EN SUPABASE DASHBOARD:"
echo ""
echo "1. Ve a: https://supabase.com/dashboard"
echo "2. Selecciona tu proyecto"
echo "3. Ve a: Authentication > Settings > URL Configuration"
echo ""
echo "4. CONFIGURA ESTAS URLs:"
echo "   - Site URL: https://lacasadelsueloradiante.es"
echo "   - Redirect URLs: https://lacasadelsueloradiante.es/auth/reset-password"
echo ""
echo "5. CONFIGURACIÓN DE EMAIL TEMPLATES:"
echo "   - Ve a: Authentication > Templates"
echo "   - Edita 'Reset Password' template"
echo "   - Cambia la URL base si es necesario"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Las URLs de redirección se configuran en el Dashboard"
echo "   - NO se pueden cambiar por variables de entorno en Supabase Cloud"
echo "   - Después de cambiar, espera unos minutos para que se apliquen"
echo ""
echo "🧪 PARA PROBAR:"
echo "   curl -X POST \"http://localhost:3000/api/send-reset-email\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"email\": \"djmartiiservicios@gmail.com\"}'"