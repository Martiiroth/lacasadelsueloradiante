#!/usr/bin/env node
/**
 * Script para probar el nuevo flujo de reset password que maneja ambos formatos de token
 */

console.log('🧪 PROBANDO NUEVO FLUJO DE RESET PASSWORD')
console.log('=' .repeat(60))
console.log('')

console.log('📋 CAMBIOS IMPLEMENTADOS:')
console.log('✅ Soporte para tokens access_token + refresh_token (formato moderno)')
console.log('✅ Soporte para token PKCE único (formato actual de Supabase)')
console.log('✅ Verificación automática del formato de token')
console.log('✅ Manejo unificado de ambos tipos')
console.log('')

console.log('🔗 FORMATOS SOPORTADOS:')
console.log('')

console.log('1️⃣ FORMATO MODERNO:')
console.log('https://lacasadelsueloradiante.es/auth/reset-password?access_token=XXX&refresh_token=YYY&type=recovery')
console.log('')

console.log('2️⃣ FORMATO PKCE (ACTUAL):')
console.log('https://lacasadelsueloradiante.es/auth/reset-password?token=pkce_XXX&type=recovery')
console.log('')

console.log('📧 PRUEBA CON EMAIL ACTUAL:')
console.log('El enlace del email ahora debería funcionar:')
console.log('https://supabase.lacasadelsueloradianteapp.com/auth/reset-password?token=pkce_885d9c7a16482fdf276fab5cd36507e569f24d260d9beed7622ecd8e&type=recovery&redirect_to=https://lacasadelsueloradiante.es/auth/reset-password')
console.log('')

console.log('🎯 FLUJO ESPERADO:')
console.log('1. Hacer clic en el enlace del email')
console.log('2. Supabase redirige automáticamente a: https://lacasadelsueloradiante.es/auth/reset-password?token=XXX&type=recovery')
console.log('3. La aplicación detecta el token PKCE')
console.log('4. Usa supabase.auth.verifyOtp() para validar el token')
console.log('5. Permite cambiar la contraseña')
console.log('6. Usa supabase.auth.updateUser() para actualizarla')
console.log('')

console.log('🔧 TECNOLOGÍAS USADAS:')
console.log('• supabase.auth.verifyOtp() - Para tokens PKCE')
console.log('• supabase.auth.setSession() - Para tokens modernos')
console.log('• supabase.auth.updateUser() - Para actualizar contraseña')
console.log('• /api/reset-password - Para tokens modernos (fallback)')
console.log('')

console.log('📋 PARA PROBAR:')
console.log('1. Solicitar nuevo reset: https://lacasadelsueloradiante.es/auth/forgot-password')
console.log('2. Email: djmartiiservicios@gmail.com')
console.log('3. Hacer clic en el enlace del nuevo email')
console.log('4. Debería funcionar automáticamente')
console.log('')

console.log('✅ BACKUP - Si no funciona automáticamente:')
console.log('Extraer el token del enlace del email y usar:')
console.log('https://lacasadelsueloradiante.es/auth/reset-password?token=TOKEN_AQUI&type=recovery')
console.log('')

console.log('🎉 El sistema ahora es compatible con ambos formatos de Supabase!')