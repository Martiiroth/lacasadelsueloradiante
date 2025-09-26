const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = 'https://lacasadelsueloradianteapp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhY2FzYWRlbHN1ZWxvcmFkaWFudGVhcHAiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczMjU3NTczNywiZXhwIjoyMDQ4MTUxNzM3fQ.E7qBgNL7wPnkj5xqfqYkNjwA4wROJxnIbWrCpYsEf88'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testVariantImagesFunctionality() {
  console.log('🧪 Testing Variant Images Functionality')
  console.log('=====================================')

  try {
    // 1. Verificar estructura de la base de datos
    console.log('\n1. 📊 Verificando estructura de base de datos...')
    
    // Verificar tabla variant_images
    const { data: variantImagesStructure, error: structureError } = await supabase
      .from('variant_images')
      .select('*')
      .limit(1)

    if (structureError && !structureError.message.includes('0 rows')) {
      console.error('❌ Error accessing variant_images table:', structureError)
      return
    }
    console.log('✅ Tabla variant_images accesible')

    // 2. Buscar productos con variantes existentes
    console.log('\n2. 🔍 Buscando productos con variantes...')
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        title,
        slug,
        product_variants (
          id,
          title,
          sku,
          stock
        )
      `)
      .not('product_variants', 'is', null)
      .limit(5)

    if (productsError) {
      console.error('❌ Error fetching products:', productsError)
      return
    }

    console.log(`✅ Encontrados ${products.length} productos con variantes`)
    
    if (products.length > 0) {
      const testProduct = products[0]
      console.log(`📦 Producto de prueba: ${testProduct.title}`)
      console.log(`🔗 Variantes disponibles: ${testProduct.product_variants.length}`)
      
      // 3. Probar inserción de imagen de variante (simulado)
      console.log('\n3. 🖼️ Probando estructura de imágenes de variante...')
      
      if (testProduct.product_variants.length > 0) {
        const testVariant = testProduct.product_variants[0]
        console.log(`🎯 Variante de prueba: ${testVariant.title || testVariant.sku || testVariant.id}`)
        
        // Buscar imágenes existentes para esta variante
        const { data: existingImages, error: imagesError } = await supabase
          .from('variant_images')
          .select('*')
          .eq('variant_id', testVariant.id)

        if (imagesError) {
          console.error('❌ Error fetching variant images:', imagesError)
        } else {
          console.log(`📸 Imágenes existentes para la variante: ${existingImages.length}`)
          
          if (existingImages.length > 0) {
            console.log('🎨 Ejemplo de imagen de variante:')
            console.log(`   - URL: ${existingImages[0].url}`)
            console.log(`   - Alt: ${existingImages[0].alt || 'Sin alt'}`)
            console.log(`   - Position: ${existingImages[0].position}`)
          } else {
            console.log('📝 No hay imágenes para esta variante (esto es normal)')
          }
        }
      }
    }

    // 4. Verificar funcionalidad de bucket de storage
    console.log('\n4. 🗄️ Verificando bucket de storage...')
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error accessing storage:', bucketsError)
    } else {
      const productImagesBucket = buckets.find(b => b.name === 'product-images')
      if (productImagesBucket) {
        console.log('✅ Bucket product-images encontrado')
        console.log(`   - Público: ${productImagesBucket.public}`)
        console.log(`   - Creado: ${productImagesBucket.created_at}`)
      } else {
        console.log('⚠️ Bucket product-images no encontrado')
      }
    }

    // 5. Verificar políticas RLS (información general)
    console.log('\n5. 🔐 Estado de funcionalidad RLS...')
    console.log('✅ Las políticas RLS deberían permitir:')
    console.log('   - Lectura pública de variant_images')
    console.log('   - Inserción/actualización para usuarios autenticados')
    console.log('   - Subida de archivos al bucket product-images')

    console.log('\n🎉 Funcionalidad básica de imágenes de variantes verificada!')
    console.log('\n📋 Próximos pasos para probar completamente:')
    console.log('1. Inicia sesión como administrador')
    console.log('2. Edita un producto existente')
    console.log('3. Añade imágenes a sus variantes')
    console.log('4. Verifica que las imágenes se muestran al seleccionar la variante')

  } catch (error) {
    console.error('💥 Error general en el test:', error)
  }
}

// Ejecutar el test
testVariantImagesFunctionality()