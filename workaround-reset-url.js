#!/usr/bin/env node
/**
 * Workaround para el problema de redirección de Supabase
 * Este script puede extraer los tokens de una URL de Supabase y generar la URL correcta
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔧 WORKAROUND PARA PROBLEMA DE REDIRECCIÓN')
console.log('=' .repeat(60))
console.log('')

console.log('📋 INSTRUCCIONES:')
console.log('1. Del email que recibiste, copia toda la URL que empieza con:')
console.log('   https://supabase.lacasadelsueloradianteapp.com/auth/reset-password...')
console.log('')
console.log('2. Pégala aquí abajo para extraer los tokens y generar la URL correcta')
console.log('')

// Función para extraer tokens de una URL de Supabase
function extractTokensFromUrl(url) {
  try {
    const urlObj = new URL(url)
    const params = urlObj.searchParams
    
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    const token_type = params.get('token_type')
    const type = params.get('type')
    
    console.log('✅ Tokens extraídos exitosamente:')
    console.log(`   access_token: ${access_token ? access_token.substring(0, 20) + '...' : 'No encontrado'}`)
    console.log(`   refresh_token: ${refresh_token ? refresh_token.substring(0, 20) + '...' : 'No encontrado'}`)
    console.log(`   type: ${type}`)
    console.log(`   token_type: ${token_type}`)
    console.log('')
    
    if (access_token && refresh_token) {
      const correctUrl = `https://lacasadelsueloradiante.es/auth/reset-password?access_token=${access_token}&refresh_token=${refresh_token}&type=recovery`
      
      console.log('🎯 URL CORRECTA PARA USAR:')
      console.log('┌─────────────────────────────────────────────────────────────┐')
      console.log('│ Copia y pega esta URL en tu navegador:                     │')
      console.log('└─────────────────────────────────────────────────────────────┘')
      console.log('')
      console.log(correctUrl)
      console.log('')
      console.log('📋 O simplemente:')
      console.log('1. Ve a: https://lacasadelsueloradiante.es/auth/reset-password')
      console.log('2. Añade estos parámetros a la URL:')
      console.log(`   ?access_token=${access_token}&refresh_token=${refresh_token}&type=recovery`)
      
      return { access_token, refresh_token, correctUrl }
    } else {
      console.log('❌ No se pudieron extraer los tokens necesarios')
      return null
    }
  } catch (error) {
    console.log('❌ Error procesando la URL:', error.message)
    return null
  }
}

console.log('🧪 EJEMPLO DE USO:')
console.log('Si tienes una URL como esta (ejemplo):')
const exampleUrl = 'https://supabase.lacasadelsueloradianteapp.com/auth/reset-password?access_token=EXAMPLE_TOKEN&refresh_token=EXAMPLE_REFRESH&type=recovery'
console.log(exampleUrl)
console.log('')
console.log('El resultado sería:')
extractTokensFromUrl(exampleUrl.replace('EXAMPLE_TOKEN', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.example').replace('EXAMPLE_REFRESH', 'refresh_example_token_here'))

console.log('')
console.log('⚡ PARA USAR ESTE WORKAROUND:')
console.log('1. Encuentra la URL completa en el email')
console.log('2. Extrae los tokens access_token y refresh_token')
console.log('3. Ve a: https://lacasadelsueloradiante.es/auth/reset-password')
console.log('4. Añade los tokens como parámetros de URL')
console.log('5. El sistema debería funcionar normalmente')
console.log('')
console.log('🎯 SOLUCIÓN DEFINITIVA:')
console.log('Configurar correctamente el Site URL en Supabase Dashboard')