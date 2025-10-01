#!/usr/bin/env node

/**
 * Script de diagnóstico para verificar la configuración de imágenes en producción
 * Identifica problemas con URLs de Supabase Storage
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.production' })

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

const log = {
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`),
  subtitle: (msg) => console.log(`${colors.magenta}${msg}${colors.reset}`)
}

async function diagnoseProductionImages() {
  log.title()
  log.subtitle('🔍 DIAGNÓSTICO DE IMÁGENES EN PRODUCCIÓN')
  log.title()

  // 1. Verificar variables de entorno
  console.log('\n📋 1. VARIABLES DE ENTORNO:')
  console.log('-'.repeat(60))
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log(`URL configurada: ${supabaseUrl}`)
  
  if (!supabaseUrl) {
    log.error('NEXT_PUBLIC_SUPABASE_URL no está configurada')
    process.exit(1)
  }
  
  if (!supabaseKey) {
    log.error('NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada')
    process.exit(1)
  }
  
  log.success('Variables de entorno configuradas')

  // 2. Identificar el dominio real de Supabase
  console.log('\n🌐 2. ANÁLISIS DE DOMINIO:')
  console.log('-'.repeat(60))
  
  let realSupabaseUrl = supabaseUrl
  let isCustomDomain = false
  
  if (supabaseUrl.includes('supabase.lacasadelsueloradianteapp.com')) {
    isCustomDomain = true
    log.warning('Estás usando un dominio personalizado')
    
    // Extraer el project ID del dominio real
    // El dominio real debería ser: https://lacasadelsueloradianteapp.supabase.co
    const projectId = 'lacasadelsueloradianteapp'
    realSupabaseUrl = `https://${projectId}.supabase.co`
    
    console.log(`Dominio configurado: ${supabaseUrl}`)
    console.log(`Dominio real de Storage: ${realSupabaseUrl}`)
    log.warning('Las imágenes se sirven desde el dominio real, NO desde el personalizado')
  } else {
    log.success('Usando dominio estándar de Supabase')
  }

  // 3. Crear cliente de Supabase
  console.log('\n🔌 3. CONEXIÓN A SUPABASE:')
  console.log('-'.repeat(60))
  
  let supabase
  try {
    // Intentar con dominio real para Storage
    supabase = createClient(realSupabaseUrl, supabaseKey)
    log.success('Cliente de Supabase creado correctamente')
  } catch (error) {
    log.error(`Error creando cliente: ${error.message}`)
    process.exit(1)
  }

  // 4. Verificar bucket de imágenes
  console.log('\n🪣 4. VERIFICACIÓN DEL BUCKET:')
  console.log('-'.repeat(60))
  
  const bucketName = 'product-images'
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      log.error(`Error listando buckets: ${error.message}`)
    } else {
      const bucket = buckets.find(b => b.name === bucketName)
      
      if (bucket) {
        log.success(`Bucket "${bucketName}" encontrado`)
        console.log(`   - ID: ${bucket.id}`)
        console.log(`   - Público: ${bucket.public ? 'Sí' : 'No'}`)
        console.log(`   - Creado: ${new Date(bucket.created_at).toLocaleDateString()}`)
        
        if (!bucket.public) {
          log.warning('El bucket NO es público. Las imágenes pueden no cargarse sin autenticación.')
        }
      } else {
        log.error(`Bucket "${bucketName}" NO encontrado`)
        console.log('Buckets disponibles:', buckets.map(b => b.name).join(', '))
      }
    }
  } catch (error) {
    log.error(`Error verificando bucket: ${error.message}`)
  }

  // 5. Listar archivos en el bucket
  console.log('\n📁 5. ARCHIVOS EN EL BUCKET:')
  console.log('-'.repeat(60))
  
  try {
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list('products', {
        limit: 5,
        offset: 0,
      })
    
    if (error) {
      log.error(`Error listando archivos: ${error.message}`)
    } else if (files && files.length > 0) {
      log.success(`${files.length} archivos encontrados (mostrando máximo 5)`)
      
      files.forEach((file, index) => {
        console.log(`\n   📄 Archivo ${index + 1}:`)
        console.log(`      Nombre: ${file.name}`)
        
        // Generar URL pública
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(`products/${file.name}`)
        
        if (urlData?.publicUrl) {
          console.log(`      URL: ${urlData.publicUrl}`)
          
          // Verificar si la URL usa el dominio correcto
          if (urlData.publicUrl.includes('.supabase.co')) {
            log.success('URL usa dominio estándar de Supabase')
          } else if (urlData.publicUrl.includes('supabase.lacasadelsueloradianteapp.com')) {
            log.warning('URL usa dominio personalizado - puede causar problemas')
          }
        }
      })
    } else {
      log.warning('No hay archivos en el bucket o la carpeta "products" está vacía')
    }
  } catch (error) {
    log.error(`Error listando archivos: ${error.message}`)
  }

  // 6. Verificar next.config.js
  console.log('\n⚙️  6. CONFIGURACIÓN DE NEXT.JS:')
  console.log('-'.repeat(60))
  
  const fs = require('fs')
  const path = require('path')
  
  try {
    const configPath = path.join(process.cwd(), 'next.config.js')
    const configContent = fs.readFileSync(configPath, 'utf-8')
    
    // Verificar dominios permitidos
    const hasStandardDomain = configContent.includes('lacasadelsueloradianteapp.supabase.co')
    const hasCustomDomain = configContent.includes('supabase.lacasadelsueloradianteapp.com')
    const hasWildcard = configContent.includes('*.supabase.co')
    
    if (hasStandardDomain) {
      log.success('Dominio estándar de Supabase configurado')
    } else {
      log.error('Falta configurar: lacasadelsueloradianteapp.supabase.co')
    }
    
    if (hasCustomDomain) {
      log.info('Dominio personalizado configurado')
    }
    
    if (hasWildcard) {
      log.success('Wildcard *.supabase.co configurado (buena práctica)')
    }
    
  } catch (error) {
    log.error(`Error leyendo next.config.js: ${error.message}`)
  }

  // 7. Recomendaciones
  console.log('\n💡 7. RECOMENDACIONES:')
  console.log('-'.repeat(60))
  
  if (isCustomDomain) {
    console.log('\n⚠️  PROBLEMA DETECTADO:')
    console.log('   Tu .env.production usa un dominio personalizado, pero Supabase Storage')
    console.log('   sirve las imágenes desde el dominio estándar *.supabase.co')
    console.log('')
    console.log('🔧 SOLUCIÓN:')
    console.log('   1. En producción, las imágenes se cargan desde:')
    console.log(`      ${realSupabaseUrl}/storage/v1/object/public/...`)
    console.log('')
    console.log('   2. Verifica que next.config.js permita este dominio')
    console.log('   3. Verifica que el bucket sea público')
    console.log('   4. Si usas proxy/CDN, configura las rutas de storage correctamente')
  }
  
  console.log('\n✅ Pasos siguientes:')
  console.log('   1. Verificar que el bucket "product-images" sea público en Supabase')
  console.log('   2. Verificar políticas RLS del bucket')
  console.log('   3. Probar las URLs de las imágenes directamente en el navegador')
  console.log('   4. Verificar CORS si hay errores de cross-origin')
  
  log.title()
  log.subtitle('✨ DIAGNÓSTICO COMPLETADO')
  log.title()
}

// Ejecutar diagnóstico
diagnoseProductionImages().catch(error => {
  log.error(`Error fatal: ${error.message}`)
  console.error(error)
  process.exit(1)
})
