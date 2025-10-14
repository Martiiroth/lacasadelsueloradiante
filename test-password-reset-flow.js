#!/usr/bin/env node
/**
 * Script para probar el flujo completo de recuperación de contraseña
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 Configuración de Supabase:')
console.log(`URL: ${supabaseUrl}`)
console.log(`Service Key: ${supabaseServiceKey ? '✅ Configurada' : '❌ Falta'}`)
console.log('')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testPasswordResetFlow() {
  const testEmail = 'javipablo0408@gmail.com'
  
  console.log('🧪 PROBANDO FLUJO DE RECUPERACIÓN DE CONTRASEÑA')
  console.log('='.repeat(60))
  console.log('')

  // 1. Verificar que el usuario existe
  console.log('1️⃣ Verificando que el usuario existe...')
  try {
    const { data: users, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('❌ Error consultando usuarios:', error.message)
      return
    }

    const user = users.users.find(u => u.email === testEmail)
    
    if (!user) {
      console.log(`❌ Usuario ${testEmail} no encontrado`)
      console.log('📋 Usuarios disponibles:')
      users.users.forEach(u => console.log(`   - ${u.email}`))
      return
    }
    
    console.log(`✅ Usuario encontrado: ${user.email}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Creado: ${new Date(user.created_at).toLocaleString()}`)
  } catch (error) {
    console.error('❌ Error:', error.message)
    return
  }

  console.log('')

  // 2. Probar configuración de Auth
  console.log('2️⃣ Verificando configuración de Auth...')
  try {
    // Obtener configuración de Auth
    const { data: config, error } = await supabase.auth.admin.getUser(
      // Usar el primer usuario para probar que la configuración funciona
      (await supabase.auth.admin.listUsers()).data.users[0].id
    )
    
    if (error) {
      console.error('❌ Error en configuración Auth:', error.message)
      return
    }
    
    console.log('✅ Configuración de Auth funcional')
  } catch (error) {
    console.error('❌ Error verificando Auth:', error.message)
    return
  }

  console.log('')

  // 3. Simular envío de reset email (usando API local)
  console.log('3️⃣ Probando envío de reset email...')
  try {
    const response = await fetch('http://localhost:3000/api/send-reset-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ API de reset email funciona correctamente')
      console.log(`   Respuesta: ${result.message}`)
    } else {
      console.log('❌ Error en API de reset email')
      console.log(`   Error: ${result.error}`)
    }
  } catch (error) {
    console.log('⚠️ No se pudo conectar al servidor local (puerto 3000)')
    console.log('   Esto es normal si el servidor no está corriendo')
    console.log(`   Error: ${error.message}`)
  }

  console.log('')

  // 4. Verificar configuración de variables de entorno
  console.log('4️⃣ Verificando variables de entorno...')
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SITE_URL'
  ]

  let allConfigured = true
  requiredVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      console.log(`✅ ${varName}: Configurada`)
    } else {
      console.log(`❌ ${varName}: FALTA`)
      allConfigured = false
    }
  })

  console.log('')

  // 5. Resumen
  console.log('📋 RESUMEN DE LA CONFIGURACIÓN')
  console.log('='.repeat(40))
  
  if (allConfigured) {
    console.log('✅ Todas las variables de entorno están configuradas')
  } else {
    console.log('❌ Faltan algunas variables de entorno')
  }

  console.log('')
  console.log('🔗 URLs del flujo:')
  console.log(`   Solicitar reset: ${process.env.NEXT_PUBLIC_SITE_URL}/auth/forgot-password`)
  console.log(`   Reset password: ${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`)
  
  console.log('')
  console.log('📧 Configuración de emails:')
  console.log('   ⚠️ Supabase maneja el envío de emails automáticamente')
  console.log('   ⚠️ Verifica la configuración SMTP en el dashboard de Supabase')
  console.log('   ⚠️ URL: https://supabase.lacasadelsueloradianteapp.com')

  console.log('')
  console.log('🎯 PRÓXIMOS PASOS:')
  console.log('1. Verificar configuración SMTP en el dashboard de Supabase')
  console.log('2. Probar el flujo completo en el navegador')
  console.log('3. Revisar logs de Supabase para ver si los emails se están enviando')
}

// Ejecutar el test
testPasswordResetFlow().catch(console.error)