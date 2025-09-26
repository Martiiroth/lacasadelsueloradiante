// Script de diagnóstico para verificar productos en la base de datos
import { supabase } from '../src/lib/supabase.js'

async function checkProducts() {
  console.log('🔍 Verificando productos en la base de datos...')
  
  try {
    // Verificar si hay productos
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, slug')
      .limit(10)

    if (productsError) {
      console.error('❌ Error al consultar productos:', productsError)
      return
    }

    console.log('📊 Productos encontrados:', products?.length || 0)
    
    if (products && products.length > 0) {
      console.log('📋 Lista de productos:')
      products.forEach((product, index) => {
        console.log(`${index + 1}. ID: ${product.id}, Título: ${product.title}, Slug: ${product.slug}`)
      })
      
      // Probar consulta completa con el primer producto
      const firstProduct = products[0]
      console.log(`\n🔍 Probando consulta completa con producto: ${firstProduct.title}`)
      
      const { data: fullProduct, error: fullError } = await supabase
        .from('products')
        .select(`
          *,
          variants:product_variants (
            id,
            sku,
            title,
            price_public_cents,
            stock,
            weight_grams,
            dimensions,
            created_at,
            updated_at
          ),
          images:product_images (
            id,
            url,
            alt,
            position,
            created_at
          ),
          resources:product_resources (
            id,
            type,
            name,
            url,
            description,
            created_at
          ),
          categories:product_categories (
            category:categories (
              id,
              name,
              slug
            )
          )
        `)
        .eq('id', firstProduct.id)
        .single()

      if (fullError) {
        console.error('❌ Error en consulta completa:', fullError)
      } else {
        console.log('✅ Consulta completa exitosa')
        console.log('📋 Datos cargados:', {
          title: fullProduct.title,
          variants: fullProduct.variants?.length || 0,
          images: fullProduct.images?.length || 0,
          resources: fullProduct.resources?.length || 0,
          categories: fullProduct.categories?.length || 0
        })
      }
    } else {
      console.log('⚠️ No se encontraron productos. Ejecutando datos de prueba...')
      
      // Ejecutar script de datos de prueba
      const { spawn } = await import('child_process')
      spawn('node', ['scripts/insert-test-data.js'], { stdio: 'inherit' })
    }
    
  } catch (error) {
    console.error('💥 Error general:', error)
  }
}

checkProducts()