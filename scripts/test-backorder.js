#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkgwuawytnuippwduhfv.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprZ3d1YXd5dG51aXBwd2R1aGZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MjI4MTIsImV4cCI6MjA0ODE5ODgxMn0.NXbJrI5TZ2ML9eOz7vv3isptEfizlAhZgzZOURaYD2Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testBackorderFlow() {
  console.log('🧪 Probando flujo de productos bajo pedido...\n')

  try {
    // 1. Listar algunos productos
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        variants:product_variants(
          id,
          title,
          stock,
          price_public_cents
        )
      `)
      .limit(3)

    if (productsError) {
      console.error('❌ Error al obtener productos:', productsError)
      return
    }

    console.log('📦 Productos encontrados:')
    products?.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title}`)
      product.variants?.forEach(variant => {
        console.log(`   - Variante: ${variant.title} (Stock: ${variant.stock})`)
      })
    })

    if (!products || products.length === 0) {
      console.log('⚠️ No se encontraron productos')
      return
    }

    // 2. Seleccionar el primer producto con variantes
    const testProduct = products.find(p => p.variants && p.variants.length > 0)
    if (!testProduct || !testProduct.variants[0]) {
      console.log('⚠️ No se encontró producto con variantes para probar')
      return
    }

    const testVariant = testProduct.variants[0]
    const originalStock = testVariant.stock

    console.log(`\n🎯 Producto seleccionado para prueba: ${testProduct.title}`)
    console.log(`📋 Variante: ${testVariant.title}`)
    console.log(`📊 Stock original: ${originalStock}`)

    // 3. Cambiar stock a 0 para simular "bajo pedido"
    console.log('\n🔄 Cambiando stock a 0...')
    const { error: updateError } = await supabase
      .from('product_variants')
      .update({ stock: 0 })
      .eq('id', testVariant.id)

    if (updateError) {
      console.error('❌ Error al actualizar stock:', updateError)
      return
    }

    console.log('✅ Stock actualizado a 0')
    console.log('\n📋 Pasos para probar:')
    console.log('1. Ve a la página principal del sitio')
    console.log(`2. Busca el producto: "${testProduct.title}"`)
    console.log('3. Verifica que aparece "Bajo pedido" en lugar de "Sin stock"')
    console.log('4. Haz clic en el producto')
    console.log('5. Verifica que el botón dice "Pedir bajo pedido" en lugar de "Sin stock"')
    console.log('6. Añádelo al carrito y verifica las advertencias')
    console.log('7. Ve al carrito y checkout para ver las advertencias completas')

    // 4. Esperar un momento y restaurar el stock
    console.log('\n⏳ Esperando 30 segundos antes de restaurar stock...')
    console.log('💡 Usa este tiempo para probar la funcionalidad')
    
    await new Promise(resolve => setTimeout(resolve, 30000))

    console.log('\n🔄 Restaurando stock original...')
    const { error: restoreError } = await supabase
      .from('product_variants')
      .update({ stock: originalStock })
      .eq('id', testVariant.id)

    if (restoreError) {
      console.error('❌ Error al restaurar stock:', restoreError)
      console.log(`⚠️ IMPORTANTE: Restaura manualmente el stock del producto ${testProduct.title} a ${originalStock}`)
      return
    }

    console.log(`✅ Stock restaurado a ${originalStock}`)
    console.log('🎉 Prueba completada exitosamente!')

  } catch (error) {
    console.error('💥 Error inesperado:', error)
  }
}

// Ejecutar la prueba
testBackorderFlow()