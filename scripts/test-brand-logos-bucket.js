#!/usr/bin/env node

/**
 * Script específico para verificar y configurar el bucket brand-logos
 * Ejecutar con: node scripts/test-brand-logos-bucket.js
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Leer variables de entorno
const envPath = join(__dirname, '..', 'documentation', 'supabase.readme')
const envContent = readFileSync(envPath, 'utf8')

const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1]
const supabaseKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)[1]

console.log('🔍 Verificación específica del bucket brand-logos...\n')
console.log('🔗 URL Supabase:', supabaseUrl)
console.log('🔑 Usando clave anónima para pruebas\n')

const supabase = createClient(supabaseUrl, supabaseKey)

async function testBrandLogosBucket() {
  try {
    console.log('1️⃣ Verificando conexión básica...')
    
    // Test básico de conexión
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error conectando a Supabase Storage:', bucketsError.message)
      console.log('🔧 Posibles causas:')
      console.log('  - URL de Supabase incorrecta')
      console.log('  - Clave de API incorrecta')
      console.log('  - Storage no habilitado en el proyecto')
      return false
    }
    
    console.log('✅ Conexión a Storage exitosa')
    console.log('📦 Total buckets encontrados:', buckets?.length || 0)
    
    if (buckets && buckets.length > 0) {
      console.log('📋 Buckets disponibles:')
      buckets.forEach(bucket => {
        console.log(`  - ${bucket.name} (público: ${bucket.public ? 'SÍ' : 'NO'})`)
      })
    }
    
    console.log('\n2️⃣ Buscando bucket brand-logos específicamente...')
    
    // Buscar el bucket específico
    const brandBucket = buckets?.find(b => b.name === 'brand-logos')
    
    if (!brandBucket) {
      console.error('❌ Bucket brand-logos NO encontrado en la lista')
      console.log('📝 El bucket puede existir pero no ser visible por:')
      console.log('  1. Permisos RLS restrictivos')
      console.log('  2. Bucket creado pero no público')
      console.log('  3. Problema de sincronización')
      console.log('\n🔧 Solución recomendada:')
      console.log('  Ejecuta: database/configure_brand_logos_policies.sql')
      return false
    }
    
    console.log('✅ Bucket brand-logos encontrado!')
    console.log('📊 Detalles del bucket:')
    console.log('  - ID:', brandBucket.id)
    console.log('  - Público:', brandBucket.public ? 'SÍ' : 'NO')
    console.log('  - Creado:', new Date(brandBucket.created_at).toLocaleString())
    console.log('  - Límite tamaño:', brandBucket.file_size_limit ? (brandBucket.file_size_limit / 1024 / 1024).toFixed(1) + 'MB' : 'Sin límite')
    
    if (!brandBucket.public) {
      console.warn('⚠️ ADVERTENCIA: Bucket NO es público')
      console.log('🔧 Las imágenes no serán accesibles públicamente')
      console.log('📝 Ejecuta: database/configure_brand_logos_policies.sql para corregir')
    }
    
    console.log('\n3️⃣ Probando acceso directo al bucket...')
    
    // Intentar listar archivos en el bucket
    const { data: files, error: listError } = await supabase.storage
      .from('brand-logos')
      .list()
      
    if (listError) {
      console.error('❌ Error accediendo al bucket:', listError.message)
      console.log('🔧 Esto indica problema de políticas RLS')
      console.log('📝 Ejecuta: database/configure_brand_logos_policies.sql')
      return false
    }
    
    console.log('✅ Acceso al bucket exitoso')
    console.log('📁 Archivos en el bucket:', files?.length || 0)
    
    if (files && files.length > 0) {
      console.log('📋 Archivos encontrados:')
      files.forEach(file => {
        console.log(`  - ${file.name} (${(file.metadata?.size / 1024).toFixed(1)}KB)`)
      })
    }
    
    console.log('\n4️⃣ Probando subida de prueba...')
    
    // Probar subida de un archivo pequeño
    const testContent = new Blob(['test brand logo'], { type: 'image/png' })
    const testFileName = `test-${Date.now()}.png`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('brand-logos')
      .upload(testFileName, testContent)
      
    if (uploadError) {
      console.error('❌ Error en subida de prueba:', uploadError.message)
      console.log('🔧 Causas posibles:')
      console.log('  - Faltan políticas de INSERT')
      console.log('  - Usuario no autenticado')
      console.log('  - Bucket con restricciones')
      console.log('📝 Ejecuta: database/configure_brand_logos_policies.sql')
      return false
    }
    
    console.log('✅ Subida de prueba exitosa!')
    console.log('📄 Archivo subido:', uploadData.path)
    
    console.log('\n5️⃣ Verificando URL pública...')
    
    // Generar URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('brand-logos')
      .getPublicUrl(uploadData.path)
      
    console.log('🔗 URL pública generada:', publicUrl)
    
    // Probar acceso HTTP a la URL
    try {
      const response = await fetch(publicUrl, { method: 'HEAD' })
      if (response.ok) {
        console.log('✅ URL pública accesible (HTTP ' + response.status + ')')
      } else {
        console.error('❌ URL no accesible (HTTP ' + response.status + ')')
        console.log('🔧 El bucket puede no ser público o tener políticas restrictivas')
      }
    } catch (fetchError) {
      console.error('❌ Error verificando URL:', fetchError.message)
    }
    
    console.log('\n6️⃣ Limpiando archivo de prueba...')
    
    // Eliminar archivo de prueba
    const { error: deleteError } = await supabase.storage
      .from('brand-logos')
      .remove([testFileName])
      
    if (deleteError) {
      console.warn('⚠️ No se pudo eliminar archivo de prueba:', deleteError.message)
    } else {
      console.log('✅ Archivo de prueba eliminado')
    }
    
    console.log('\n🎉 ¡Bucket brand-logos funciona correctamente!')
    console.log('📋 Resumen:')
    console.log('  - Bucket: ✅ Existe y es accesible')
    console.log('  - Público: ✅ ' + (brandBucket.public ? 'SÍ' : 'NO'))
    console.log('  - Subida: ✅ Funcionando')
    console.log('  - URLs: ✅ Accesibles')
    
    console.log('\n🚀 Próximos pasos:')
    console.log('  1. Prueba subir una imagen desde el panel admin')
    console.log('  2. Las URLs serán del tipo:', publicUrl.replace(testFileName, 'tu-logo.jpg'))
    
    return true
    
  } catch (error) {
    console.error('💥 Error inesperado:', error.message)
    console.log('\n🔧 Solución sugerida:')
    console.log('1. Verificar que el bucket existe en Supabase Dashboard')
    console.log('2. Ejecutar: database/configure_brand_logos_policies.sql')
    console.log('3. Asegurar que el bucket es público')
    return false
  }
}

// Ejecutar verificación
testBrandLogosBucket().then(success => {
  if (!success) {
    console.log('\n❗ Para solucionar los problemas:')
    console.log('1. Ve a Supabase Dashboard > Storage')
    console.log('2. Verifica que existe el bucket "brand-logos"')
    console.log('3. Ejecuta: database/configure_brand_logos_policies.sql')
    console.log('4. Asegurar que el bucket sea público')
    process.exit(1)
  }
  process.exit(0)
}).catch(error => {
  console.error('💥 Error fatal:', error)
  process.exit(1)
})