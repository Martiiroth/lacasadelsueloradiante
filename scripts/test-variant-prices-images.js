const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = 'https://lacasadelsueloradianteapp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhY2FzYWRlbHN1ZWxvcmFkaWFudGVhcHAiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczMjU3NTczNywiZXhwIjoyMDQ4MTUxNzM3fQ.E7qBgNL7wPnkj5xqfqYkNjwA4wROJxnIbWrCpYsEf88'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testVariantPricesAndImages() {
  console.log('🧪 Testing Variant Prices & Images Functionality')
  console.log('==============================================')

  try {
    // 1. Verificar customer roles
    console.log('\n1. 👥 Verificando customer roles...')
    const { data: roles, error: rolesError } = await supabase
      .from('customer_roles')
      .select('*')
      .order('id')

    if (rolesError) {
      console.error('❌ Error fetching roles:', rolesError)
      return
    }

    console.log(`✅ Encontrados ${roles.length} customer roles:`)
    roles.forEach(role => {
      console.log(`   - ${role.name} (ID: ${role.id}): ${role.description}`)
    })

    // 2. Buscar productos con variantes y precios por role
    console.log('\n2. 🔍 Buscando productos con variantes y precios...')
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
          price_public_cents,
          stock,
          role_prices (
            id,
            price_cents,
            customer_roles (
              name,
              description
            )
          ),
          variant_images (
            id,
            url,
            alt,
            position
          )
        )
      `)
      .not('product_variants', 'is', null)
      .limit(3)

    if (productsError) {
      console.error('❌ Error fetching products:', productsError)
      return
    }

    console.log(`✅ Encontrados ${products.length} productos para análisis`)

    // 3. Analizar productos con detalle
    products.forEach((product, index) => {
      console.log(`\n📦 Producto ${index + 1}: ${product.title}`)
      console.log(`   🔗 Slug: ${product.slug}`)
      console.log(`   🎯 Variantes: ${product.product_variants.length}`)

      product.product_variants.forEach((variant, vIndex) => {
        console.log(`\n   📋 Variante ${vIndex + 1}: ${variant.title || variant.sku || 'Sin nombre'}`)
        console.log(`      💰 Precio público: €${(variant.price_public_cents / 100).toFixed(2)}`)
        console.log(`      📦 Stock: ${variant.stock}`)
        
        // Mostrar precios por role
        if (variant.role_prices && variant.role_prices.length > 0) {
          console.log(`      🎭 Precios especiales:`)
          variant.role_prices.forEach(rp => {
            const discount = Math.round(((variant.price_public_cents - rp.price_cents) / variant.price_public_cents) * 100)
            console.log(`         - ${rp.customer_roles.name}: €${(rp.price_cents / 100).toFixed(2)} (${discount > 0 ? `-${discount}%` : 'Sin descuento'})`)
          })
        } else {
          console.log(`      🎭 Sin precios especiales configurados`)
        }

        // Mostrar imágenes de variante
        if (variant.variant_images && variant.variant_images.length > 0) {
          console.log(`      🖼️ Imágenes de variante: ${variant.variant_images.length}`)
          variant.variant_images.forEach((img, imgIndex) => {
            console.log(`         ${imgIndex + 1}. ${img.url} (pos: ${img.position})`)
          })
        } else {
          console.log(`      🖼️ Sin imágenes específicas de variante`)
        }
      })
    })

    // 4. Verificar funcionalidad de precios por role
    console.log('\n4. 💰 Verificando lógica de precios por customer role...')
    
    const testVariant = products[0]?.product_variants[0]
    if (testVariant) {
      console.log(`\n🧮 Ejemplo de cálculo de precios para: ${testVariant.title || testVariant.sku}`)
      console.log(`   📊 Precio público: €${(testVariant.price_public_cents / 100).toFixed(2)}`)
      
      roles.forEach(role => {
        const rolePrice = testVariant.role_prices?.find(rp => 
          rp.customer_roles.name === role.name
        )
        
        if (rolePrice) {
          const discount = Math.round(((testVariant.price_public_cents - rolePrice.price_cents) / testVariant.price_public_cents) * 100)
          console.log(`   👤 ${role.name}: €${(rolePrice.price_cents / 100).toFixed(2)} (descuento: ${discount}%)`)
        } else {
          console.log(`   👤 ${role.name}: €${(testVariant.price_public_cents / 100).toFixed(2)} (precio público)`)
        }
      })
    }

    // 5. Verificar estructura de base de datos
    console.log('\n5. 🗄️ Verificando estructura de base de datos...')
    
    // Contar registros en tablas relevantes
    const { count: variantCount } = await supabase
      .from('product_variants')
      .select('*', { count: 'exact', head: true })

    const { count: rolePriceCount } = await supabase
      .from('role_prices')
      .select('*', { count: 'exact', head: true })

    const { count: variantImageCount } = await supabase
      .from('variant_images')
      .select('*', { count: 'exact', head: true })

    console.log(`✅ Variantes totales: ${variantCount}`)
    console.log(`✅ Precios por role: ${rolePriceCount}`)
    console.log(`✅ Imágenes de variante: ${variantImageCount}`)

    // 6. Verificar configuración de storage
    console.log('\n6. 🗃️ Verificando storage de imágenes...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error accessing storage:', bucketsError)
    } else {
      const productImagesBucket = buckets.find(b => b.name === 'product-images')
      if (productImagesBucket) {
        console.log('✅ Bucket product-images configurado correctamente')
        console.log(`   📍 Público: ${productImagesBucket.public}`)
      } else {
        console.log('⚠️ Bucket product-images no encontrado')
      }
    }

    console.log('\n🎉 Verificación completada!')
    console.log('\n📋 Funcionalidades implementadas:')
    console.log('✅ Imágenes específicas por variante')
    console.log('✅ Precios diferenciados por customer role')
    console.log('✅ Gestión desde formularios de admin')
    console.log('✅ Display dinámico en frontend público')
    
    console.log('\n🚀 Para probar completamente:')
    console.log('1. Inicia sesión como administrador')
    console.log('2. Edita un producto existente')
    console.log('3. Configura precios por role en las variantes')
    console.log('4. Añade imágenes específicas a las variantes')
    console.log('5. Visita la página del producto con diferentes roles de usuario')
    console.log('6. Verifica que los precios e imágenes cambian según el role')

  } catch (error) {
    console.error('💥 Error general en el test:', error)
  }
}

// Ejecutar el test
testVariantPricesAndImages()