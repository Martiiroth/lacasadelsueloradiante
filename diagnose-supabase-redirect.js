#!/usr/bin/env node
/**
 * Diagnóstico del problema de redirección de Supabase Auth
 */

import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

console.log('🔍 DIAGNÓSTICO DEL PROBLEMA DE REDIRECCIÓN')
console.log('=' .repeat(60))
console.log('')

console.log('📋 Variables de entorno relevantes:')
console.log(`NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL}`)
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
console.log('')

console.log('❌ PROBLEMA IDENTIFICADO:')
console.log('El enlace del email redirige a:')
console.log('   https://supabase.lacasadelsueloradianteapp.com/auth/reset-password')
console.log('')
console.log('Pero debería redirigir a:')
console.log('   https://lacasadelsueloradiante.es/auth/reset-password')
console.log('')

console.log('🛠️ SOLUCIONES POSIBLES:')
console.log('')

console.log('1️⃣ VERIFICAR CONFIGURACIÓN EN SUPABASE DASHBOARD:')
console.log('   • Ir a: https://supabase.lacasadelsueloradianteapp.com')
console.log('   • Authentication > URL Configuration')
console.log('   • Site URL debe ser: https://lacasadelsueloradiante.es')
console.log('   • Redirect URLs debe incluir: https://lacasadelsueloradiante.es/**')
console.log('')

console.log('2️⃣ CONFIGURACIÓN ESPECÍFICA PARA RESET PASSWORD:')
console.log('   En Authentication > URL Configuration verificar:')
console.log('   • Site URL: https://lacasadelsueloradiante.es')
console.log('   • Additional Redirect URLs:')
console.log('     - https://lacasadelsueloradiante.es/auth/reset-password')
console.log('     - https://lacasadelsueloradiante.es/auth/**')
console.log('')

console.log('3️⃣ VERIFICAR EMAIL TEMPLATES:')
console.log('   En Authentication > Email Templates > Reset Password:')
console.log('   • Confirm your recovery: {{ .SiteURL }}/auth/reset-password?token={{ .Token }}')
console.log('   • El {{ .SiteURL }} debe resolverse a https://lacasadelsueloradiante.es')
console.log('')

console.log('4️⃣ ALTERNATIVA - USAR CONFIRMACIÓN MANUAL:')
console.log('   Modificar el código para no depender del email de Supabase.')
console.log('')

console.log('🔧 CONFIGURACIÓN RECOMENDADA EN SUPABASE:')
console.log('┌─────────────────────────────────────────────────────────────┐')
console.log('│ Authentication Settings                                     │')
console.log('├─────────────────────────────────────────────────────────────┤')
console.log('│ Site URL: https://lacasadelsueloradiante.es                 │')
console.log('│ Additional Redirect URLs:                                   │')
console.log('│   - https://lacasadelsueloradiante.es/**                    │')
console.log('│   - https://lacasadelsueloradiante.es/auth/**               │')
console.log('│   - https://lacasadelsueloradiante.es/auth/reset-password   │')
console.log('└─────────────────────────────────────────────────────────────┘')
console.log('')

console.log('⚡ SOLUCIÓN RÁPIDA:')
console.log('1. Acceder al dashboard de Supabase')
console.log('2. Ir a Authentication > URL Configuration')
console.log('3. Cambiar "Site URL" a: https://lacasadelsueloradiante.es')
console.log('4. Guardar cambios')
console.log('5. Probar nuevamente el flujo')
console.log('')

console.log('📧 MIENTRAS TANTO - WORKAROUND:')
console.log('El usuario puede:')
console.log('1. Copiar el token de la URL del email')
console.log('2. Ir manualmente a: https://lacasadelsueloradiante.es/auth/reset-password')
console.log('3. La aplicación debería detectar los tokens en la URL')
console.log('')

console.log('✅ Una vez corregida la configuración, el flujo funcionará correctamente.')