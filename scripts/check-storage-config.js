const { createClient } = require('@supabase/supabase-js')

// Cargar variables de entorno
require('dotenv').config({ path: '.env.production' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Verificando configuración de Supabase Storage\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('📋 Variables de Entorno:')
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'} ${supabaseUrl}`)
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? '✅ (configurada)' : '❌ (falta)'}\n`)

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Faltan variables de entorno necesarias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkStorageConfig() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('🪣 Verificando bucket "product-images"...\n')

    // 1. Verificar si el bucket existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error al listar buckets:', bucketsError.message)
      return
    }

    const productImagesBucket = buckets.find(b => b.name === 'product-images')
    
    if (!productImagesBucket) {
      console.error('❌ ERROR: El bucket "product-images" NO existe')
      console.log('\n📝 Solución:')
      console.log('   1. Ve al dashboard de Supabase: ' + supabaseUrl)
      console.log('   2. Navega a Storage > New bucket')
      console.log('   3. Nombre: product-images')
      console.log('   4. Público: ✅ Activado')
      console.log('   5. Tamaño máximo: 5MB')
      return
    }

    console.log('✅ Bucket "product-images" existe')
    console.log(`   - ID: ${productImagesBucket.id}`)
    console.log(`   - Público: ${productImagesBucket.public ? '✅ Sí' : '❌ No'}`)
    console.log(`   - Creado: ${productImagesBucket.created_at}\n`)

    if (!productImagesBucket.public) {
      console.warn('⚠️  ADVERTENCIA: El bucket NO es público')
      console.log('   Las imágenes no serán accesibles públicamente\n')
    }

    // 2. Verificar archivos en el bucket
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('📂 Verificando archivos en el bucket...\n')

    const { data: files, error: filesError } = await supabase.storage
      .from('product-images')
      .list('products', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (filesError) {
      console.error('❌ Error al listar archivos:', filesError.message)
      
      if (filesError.message.includes('row-level security')) {
        console.log('\n📝 Problema: Políticas RLS no configuradas')
        console.log('   Ve a: scripts/setup-storage-policies.sql')
        console.log('   Y ejecuta las políticas en el SQL Editor de Supabase\n')
      }
      return
    }

    if (!files || files.length === 0) {
      console.log('ℹ️  No hay archivos en la carpeta "products" (bucket vacío)')
    } else {
      console.log(`✅ Se encontraron ${files.length} archivos:\n`)
      
      files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name}`)
        console.log(`      - Tamaño: ${(file.metadata?.size / 1024).toFixed(2)} KB`)
        console.log(`      - Tipo: ${file.metadata?.mimetype || 'unknown'}`)
        console.log(`      - Creado: ${file.created_at}\n`)
      })
    }

    // 3. Probar generación de URL pública
    if (files && files.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      console.log('🔗 Probando generación de URL pública...\n')

      const firstFile = files[0]
      const filePath = `products/${firstFile.name}`
      
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      if (urlData && urlData.publicUrl) {
        console.log('✅ URL pública generada correctamente:')
        console.log(`   ${urlData.publicUrl}\n`)
        
        // Verificar el formato de la URL
        const urlObj = new URL(urlData.publicUrl)
        console.log('📋 Análisis de URL:')
        console.log(`   - Protocolo: ${urlObj.protocol}`)
        console.log(`   - Hostname: ${urlObj.hostname}`)
        console.log(`   - Pathname: ${urlObj.pathname}\n`)
        
        // Verificar si el hostname está permitido en next.config.js
        if (urlObj.hostname.includes('.supabase.co')) {
          console.log('✅ El hostname está permitido en next.config.js (*.supabase.co)')
        } else {
          console.warn('⚠️  Verifica que el hostname esté permitido en next.config.js')
          console.log(`   Agrega en remotePatterns: { hostname: '${urlObj.hostname}' }\n`)
        }
      } else {
        console.error('❌ No se pudo generar URL pública')
      }
    }

    // 4. Resumen final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('📊 RESUMEN:\n')
    console.log(`✅ Bucket existe: ${productImagesBucket ? 'Sí' : 'No'}`)
    console.log(`${productImagesBucket?.public ? '✅' : '❌'} Bucket público: ${productImagesBucket?.public ? 'Sí' : 'No'}`)
    console.log(`${files && files.length > 0 ? '✅' : 'ℹ️ '} Archivos en bucket: ${files?.length || 0}`)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (!productImagesBucket?.public) {
      console.log('⚠️  ACCIÓN REQUERIDA:')
      console.log('   1. Haz el bucket público en Supabase Dashboard')
      console.log('   2. O configura las políticas RLS correctamente\n')
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message)
  }
}

checkStorageConfig()
