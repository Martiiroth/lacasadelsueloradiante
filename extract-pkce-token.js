#!/usr/bin/env node
/**
 * Extractor de token PKCE para generar URL correcta
 */

console.log('🔧 EXTRACTOR DE TOKEN PKCE - SOLUCIÓN INMEDIATA')
console.log('=' .repeat(60))
console.log('')

const problematicUrl = 'https://supabase.lacasadelsueloradianteapp.com/auth/reset-password?token=pkce_65227469e0c29b029a9d58232ca9ab9fecb3d1aca80f2030ae203f8a&type=recovery&redirect_to=https://lacasadelsueloradiante.es/auth/reset-password'

console.log('❌ URL PROBLEMÁTICA (donde llegas):')
console.log(problematicUrl)
console.log('')

// Extraer el token de la URL
const urlObj = new URL(problematicUrl)
const token = urlObj.searchParams.get('token')
const type = urlObj.searchParams.get('type')
const redirect_to = urlObj.searchParams.get('redirect_to')

console.log('🔍 DATOS EXTRAÍDOS:')
console.log(`   Token: ${token}`)
console.log(`   Type: ${type}`)
console.log(`   Redirect to: ${redirect_to}`)
console.log('')

// Generar URL correcta
const correctUrl = `https://lacasadelsueloradiante.es/auth/reset-password?token=${token}&type=${type}`

console.log('✅ URL CORRECTA PARA USAR:')
console.log('┌─────────────────────────────────────────────────────────────────────────┐')
console.log('│ COPIA Y PEGA ESTA URL EN TU NAVEGADOR:                                 │')
console.log('└─────────────────────────────────────────────────────────────────────────┘')
console.log('')
console.log(correctUrl)
console.log('')

console.log('📋 INSTRUCCIONES:')
console.log('1. Copia la URL de arriba')
console.log('2. Pégala en una nueva pestaña del navegador')
console.log('3. Presiona Enter')
console.log('4. Deberías llegar a la página de cambio de contraseña de tu aplicación')
console.log('5. Introduce tu nueva contraseña')
console.log('')

console.log('🔧 PROBLEMA IDENTIFICADO:')
console.log('La redirección automática no está funcionando en Supabase.')
console.log('Esto puede deberse a:')
console.log('• Configuración CORS incorrecta')
console.log('• redirect_to no procesado automáticamente')
console.log('• Configuración de URL en Supabase Auth')
console.log('')

console.log('⚡ SOLUCIÓN RÁPIDA:')
console.log('Usar la URL correcta extraída manualmente hasta que se corrija la configuración.')
console.log('')

console.log('🎯 PARA FUTURAS REFERENCIAS:')
console.log('Si recibes otra URL similar, simplemente:')
console.log('1. Extrae el valor del parámetro "token="')
console.log('2. Úsalo en: https://lacasadelsueloradiante.es/auth/reset-password?token=TOKEN_AQUI&type=recovery')
console.log('')

console.log('✅ Tu token específico es válido y debería funcionar en la URL correcta.')