#!/usr/bin/env node

/**
 * Script de verificación de Supabase Storage
 * Ejecutar con: node scripts/verify-storage.js
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Leer variables de entorno desde documentación
const envPath = join(__dirname, '..', 'documentation', 'supabase.readme')
const envContent = readFileSync(envPath, 'utf8')

const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1]
const supabaseKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)[1]

console.log('🔍 Verificando configuración de Supabase Storage...\n')

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyStorage() {
  try {
    // 1. Verificar conexión
    console.log('1️⃣ Verificando conexión a Supabase...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error conectando a Supabase:', bucketsError.message)
      return false
    }
    
    console.log('✅ Conexión exitosa')
    console.log('📦 Buckets encontrados:', buckets.map(b => b.name).join(', '))
    
    // 2. Verificar bucket brand-logos
    console.log('\n2️⃣ Verificando bucket brand-logos...')
    const brandBucket = buckets.find(b => b.name === 'brand-logos')
    
    if (!brandBucket) {
      console.error('❌ Bucket brand-logos NO existe')
      console.log('📝 Ejecuta: database/setup_storage_complete.sql en Supabase SQL Editor')
      return false
    }
    
    console.log('✅ Bucket brand-logos encontrado')
    console.log('🔓 Público:', brandBucket.public ? 'SÍ' : 'NO')
    console.log('📏 Límite:', (brandBucket.file_size_limit / 1024 / 1024).toFixed(1) + 'MB')
    
    if (!brandBucket.public) {
      console.error('❌ Bucket NO es público - las imágenes no serán accesibles')
      return false
    }
    
    // 3. Probar subida de archivo de prueba
    console.log('\n3️⃣ Probando subida de archivo...')
    
    // Crear un archivo de prueba simple
    const testContent = new Blob(['test image content'], { type: 'image/png' })
    const testFileName = `test-${Date.now()}.png`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('brand-logos')
      .upload(testFileName, testContent)
      
    if (uploadError) {
      console.error('❌ Error subiendo archivo:', uploadError.message)
      console.log('🔧 Revisa las políticas RLS en Supabase')
      return false
    }
    
    console.log('✅ Subida exitosa:', uploadData.path)
    
    // 4. Probar URL pública
    console.log('\n4️⃣ Verificando URL pública...')
    const { data: { publicUrl } } = supabase.storage
      .from('brand-logos')
      .getPublicUrl(uploadData.path)
      
    console.log('🔗 URL generada:', publicUrl)
    
    // Probar acceso HTTP
    try {
      const response = await fetch(publicUrl, { method: 'HEAD' })
      if (response.ok) {
        console.log('✅ URL pública accesible (HTTP ' + response.status + ')')
      } else {
        console.error('❌ URL no accesible (HTTP ' + response.status + ')')
        return false
      }
    } catch (fetchError) {
      console.error('❌ Error accediendo a URL:', fetchError.message)
      return false
    }
    
    // 5. Limpiar archivo de prueba
    console.log('\n5️⃣ Limpiando archivo de prueba...')
    const { error: deleteError } = await supabase.storage
      .from('brand-logos')
      .remove([testFileName])
      
    if (deleteError) {
      console.warn('⚠️ No se pudo eliminar archivo de prueba:', deleteError.message)
    } else {
      console.log('✅ Archivo de prueba eliminado')
    }
    
    console.log('\n🎉 ¡Storage configurado correctamente!')
    console.log('📋 Resumen:')
    console.log('  - Bucket brand-logos: ✅ Existe y es público')
    console.log('  - Subida de archivos: ✅ Funcionando') 
    console.log('  - URLs públicas: ✅ Accesibles')
    console.log('  - Políticas RLS: ✅ Configuradas')
    
    return true
    
  } catch (error) {
    console.error('💥 Error inesperado:', error.message)
    return false
  }
}

// Ejecutar verificación
verifyStorage().then(success => {
  if (!success) {
    console.log('\n❗ Acciones requeridas:')
    console.log('1. Ejecutar: database/setup_storage_complete.sql')
    console.log('2. Verificar que el bucket sea público en Supabase Dashboard')
    console.log('3. Volver a ejecutar este script')
    process.exit(1)
  }
}).catch(error => {
  console.error('💥 Error fatal:', error)
  process.exit(1)
})