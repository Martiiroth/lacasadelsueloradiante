const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://supabase.lacasadelsueloradianteapp.com'
const supabaseKey = 'eyJ0eXAiOiAiSldUIiwiYWxnIjogIkhTMjU2In0.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzU4NzAwNTMzLAogICJleHAiOiAxOTE2MzgwNTMzCn0.uhOFMEExih6oXgd9tDGK87L-xQMK6J-6w5oPDs2tnbc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProducts() {
  console.log('🔍 Verificando productos en Supabase...')
  
  try {
    // Verificar conexión con productos
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, slug')
      .limit(10)

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log('📊 Productos encontrados:', products?.length || 0)
    
    if (products && products.length > 0) {
      console.log('📋 Lista de productos:')
      products.forEach((product, index) => {
        console.log(`${index + 1}. ID: ${product.id}`)
        console.log(`   Título: ${product.title}`)
        console.log(`   Slug: ${product.slug}`)
        console.log('')
      })
    } else {
      console.log('⚠️ No se encontraron productos')
      
      // Intentar crear un producto de prueba
      console.log('🚀 Creando producto de prueba...')
      
      const { data: newProduct, error: createError } = await supabase
        .from('products')
        .insert({
          slug: 'producto-prueba-' + Date.now(),
          title: 'Producto de Prueba',
          short_description: 'Este es un producto de prueba',
          description: 'Descripción detallada del producto de prueba',
          is_new: true,
          is_on_sale: false
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creando producto:', createError)
        return
      }

      console.log('✅ Producto creado:', newProduct.title)
      console.log('🆔 ID del producto:', newProduct.id)

      // Crear una variante para el producto
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .insert({
          product_id: newProduct.id,
          sku: 'SKU-PRUEBA-001',
          title: 'Variante Principal',
          price_public_cents: 9999,
          stock: 10
        })
        .select()
        .single()

      if (variantError) {
        console.error('❌ Error creando variante:', variantError)
      } else {
        console.log('✅ Variante creada:', variant.title)
      }
    }
    
  } catch (error) {
    console.error('💥 Error general:', error)
  }
}

checkProducts()