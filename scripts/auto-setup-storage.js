#!/usr/bin/env node

/**
 * Script de configuración automática de Supabase Storage
 * Ejecutar con: node scripts/auto-setup-storage.js
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

console.log('🚀 Configurando Supabase Storage automáticamente...\n')

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupStorage() {
  try {
    console.log('1️⃣ Verificando conexión...')
    
    // Verificar conexión básica
    const { data: buckets, error } = await supabase.storage.listBuckets()
    if (error) {
      console.error('❌ Error de conexión:', error.message)
      return false
    }
    
    console.log('✅ Conectado a Supabase')
    console.log('📦 Buckets actuales:', buckets?.length ? buckets.map(b => b.name).join(', ') : 'ninguno')
    
    // Verificar si ya existe brand-logos
    const existingBucket = buckets?.find(b => b.name === 'brand-logos')
    if (existingBucket) {
      console.log('ℹ️ Bucket brand-logos ya existe')
      if (!existingBucket.public) {
        console.log('⚠️ Bucket no es público, intentando actualizar...')
      } else {
        console.log('✅ Bucket ya es público')
        return true
      }
    }
    
    console.log('\n2️⃣ Creando bucket brand-logos...')
    
    // Crear bucket con configuración específica
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('brand-logos', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 2 * 1024 * 1024 // 2MB
    })
    
    if (createError) {
      if (createError.message.includes('already exists')) {
        console.log('ℹ️ Bucket ya existe, continuando...')
      } else {
        console.error('❌ Error creando bucket:', createError.message)
        console.log('📝 Intenta ejecutar manualmente: database/setup_storage_complete.sql')
        return false
      }
    } else {
      console.log('✅ Bucket brand-logos creado exitosamente')
    }
    
    console.log('\n3️⃣ Verificando configuración final...')
    
    // Verificar que el bucket existe y es público
    const { data: finalBuckets } = await supabase.storage.listBuckets()
    const brandBucket = finalBuckets?.find(b => b.name === 'brand-logos')
    
    if (!brandBucket) {
      console.error('❌ No se pudo crear el bucket')
      return false
    }
    
    if (!brandBucket.public) {
      console.error('❌ Bucket creado pero no es público')
      console.log('🔧 Ve a Supabase Dashboard > Storage > brand-logos > Settings > Make Public')
      return false
    }
    
    console.log('✅ Bucket configurado correctamente:')
    console.log('  - Nombre: brand-logos')
    console.log('  - Público: SÍ')
    console.log('  - Límite: 2MB')
    console.log('  - Tipos: JPG, PNG, GIF, WebP')
    
    console.log('\n4️⃣ Probando funcionalidad...')
    
    // Probar subida de prueba
    const testContent = new Blob(['test'], { type: 'image/png' })
    const { data: testUpload, error: uploadError } = await supabase.storage
      .from('brand-logos')
      .upload('test-setup.png', testContent)
    
    if (uploadError) {
      console.error('❌ Error probando subida:', uploadError.message)
      console.log('🔧 Verifica las políticas RLS en Supabase Dashboard')
      return false
    }
    
    // Verificar URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('brand-logos')
      .getPublicUrl('test-setup.png')
      
    console.log('🔗 URL de prueba:', publicUrl)
    
    // Limpiar archivo de prueba
    await supabase.storage.from('brand-logos').remove(['test-setup.png'])
    
    console.log('\n🎉 ¡Storage configurado y funcionando!')
    console.log('📋 Próximos pasos:')
    console.log('  1. Las imágenes ahora se guardarán permanentemente')
    console.log('  2. Prueba subir una imagen desde el panel admin')
    console.log('  3. Las URLs serán del tipo:', publicUrl.replace('test-setup.png', 'tu-imagen.jpg'))
    
    return true
    
  } catch (error) {
    console.error('💥 Error inesperado:', error.message)
    
    if (error.message.includes('policies')) {
      console.log('\n🔧 Solución sugerida:')
      console.log('1. Ve a Supabase Dashboard > Storage')
      console.log('2. Crea bucket manualmente: brand-logos (público)')  
      console.log('3. Ejecuta: database/setup_storage_complete.sql')
    }
    
    return false
  }
}

setupStorage().then(success => {
  process.exit(success ? 0 : 1)
})