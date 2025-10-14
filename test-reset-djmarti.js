#!/usr/bin/env node
/**
 * Script para probar el flujo de recuperación de contraseña con djmartiiservicios@gmail.com
 */

import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

async function testPasswordResetForUser() {
  const testEmail = 'djmartiiservicios@gmail.com'
  
  console.log('🧪 PROBANDO RECUPERACIÓN DE CONTRASEÑA')
  console.log('='.repeat(50))
  console.log(`📧 Email de prueba: ${testEmail}`)
  console.log('')

  // 1. Verificar variables de entorno críticas
  console.log('1️⃣ Verificando configuración...')
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'NEXT_PUBLIC_SITE_URL'
  ]

  let configOk = true
  requiredVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      console.log(`✅ ${varName}: ${varName === 'NEXT_PUBLIC_SUPABASE_ANON_KEY' ? value.substring(0, 20) + '...' : value}`)
    } else {
      console.log(`❌ ${varName}: FALTA`)
      configOk = false
    }
  })

  if (!configOk) {
    console.log('❌ Configuración incompleta, abortando prueba')
    return
  }

  console.log('')

  // 2. Probar el endpoint de recuperación directamente
  console.log('2️⃣ Probando endpoint de recuperación...')
  
  try {
    // Probar en producción directamente
    const prodUrl = 'https://lacasadelsueloradiante.es'
    console.log(`🌐 Probando en producción: ${prodUrl}`)
    
    const response = await fetch(`${prodUrl}/api/send-reset-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ API de reset email funciona en producción')
      console.log(`   Respuesta: ${result.message}`)
      console.log('📧 ¡Email de recuperación enviado! Revisa djmartiiservicios@gmail.com')
    } else {
      console.log('❌ Error en API de reset email en producción')
      console.log(`   Error: ${result.error}`)
      console.log(`   Status: ${response.status}`)
    }
  } catch (error) {
    console.log('❌ Error conectando con la API')
    console.log(`   Error: ${error.message}`)
  }

  console.log('')

  // 3. Información del flujo completo
  console.log('3️⃣ Información del flujo completo:')
  console.log('')
  
  const siteUrl = 'https://lacasadelsueloradiante.es'
  
  console.log('📋 PASOS PARA PROBAR MANUALMENTE:')
  console.log(`1. Ir a: ${siteUrl}/auth/forgot-password`)
  console.log(`2. Introducir email: ${testEmail}`)
  console.log('3. Hacer clic en "Enviar enlace de recuperación"')
  console.log('4. Revisar el email en djmartiiservicios@gmail.com')
  console.log('5. Hacer clic en el enlace del email')
  console.log('6. Introducir nueva contraseña')
  
  console.log('')
  console.log('🔗 URLs importantes:')
  console.log(`   Recuperar: ${siteUrl}/auth/forgot-password`)
  console.log(`   Reset: ${siteUrl}/auth/reset-password`)
  console.log(`   Login: ${siteUrl}/auth/login`)
  
  console.log('')
  console.log('📧 IMPORTANTE - Configuración de emails:')
  console.log('   • Supabase maneja el envío de emails automáticamente')
  console.log('   • Los emails se envían desde la configuración SMTP de Supabase')
  console.log('   • Verifica en el dashboard de Supabase si los emails están configurados')
  console.log('   • URL del dashboard: https://supabase.lacasadelsueloradianteapp.com')
  
  console.log('')
  console.log('🎯 QUÉ REVISAR SI NO LLEGA EL EMAIL:')
  console.log('1. Carpeta de spam/correo no deseado')
  console.log('2. Configuración SMTP en Supabase Auth Settings')
  console.log('3. Logs de Supabase para ver errores de envío')
  console.log('4. Que el usuario exista en la base de datos')

  console.log('')
  console.log('✅ Script completado. Revisa djmartiiservicios@gmail.com')
}

// Ejecutar el test
testPasswordResetForUser().catch(console.error)