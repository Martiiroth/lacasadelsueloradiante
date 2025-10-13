#!/usr/bin/env node

// Script para probar funcionalidad "Bajo pedido"
// Pone algunos productos con stock 0 para ver cómo se comporta el sistema

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testBajoPedido() {
  console.log('🧪 Probando funcionalidad "Bajo pedido"...\n')

  try {
    // 1. Buscar algunos productos para ponerles stock 0
    console.log('📦 Buscando productos para test...')
    const { data: variants, error } = await supabase
      .from('product_variants')
      .select(`
        id,
        sku,
        title,
        stock,
        product:products(title)
      `)
      .limit(3)

    if (error) throw error

    if (!variants || variants.length === 0) {
      console.log('❌ No se encontraron productos para el test')
      return
    }

    console.log(`✅ Encontrados ${variants.length} productos\n`)

    // 2. Guardar stock original y poner a 0
    const originalStocks = []
    
    for (const variant of variants) {
      originalStocks.push({
        id: variant.id,
        originalStock: variant.stock
      })

      console.log(`📝 Producto: ${variant.product?.title} - ${variant.title}`)
      console.log(`   Stock actual: ${variant.stock} → Cambiando a: 0`)

      const { error: updateError } = await supabase
        .from('product_variants')
        .update({ stock: 0 })
        .eq('id', variant.id)

      if (updateError) {
        console.error(`❌ Error actualizando ${variant.sku}:`, updateError.message)
      } else {
        console.log(`✅ Stock actualizado para ${variant.sku}`)
      }
    }

    console.log('\n🎯 TEST CONFIGURADO:')
    console.log('- Ve a la tienda web')
    console.log('- Los productos deberían mostrar "Bajo pedido"')
    console.log('- Deberías poder añadirlos al carrito')
    console.log('- En el checkout debería aparecer la advertencia\n')

    console.log('⏳ Presiona ENTER para restaurar el stock original...')
    await waitForEnter()

    // 3. Restaurar stock original
    console.log('\n🔄 Restaurando stock original...')
    
    for (const stockData of originalStocks) {
      const { error: restoreError } = await supabase
        .from('product_variants')
        .update({ stock: stockData.originalStock })
        .eq('id', stockData.id)

      if (restoreError) {
        console.error(`❌ Error restaurando ${stockData.id}:`, restoreError.message)
      } else {
        console.log(`✅ Stock restaurado para ${stockData.id}`)
      }
    }

    console.log('\n✅ Test completado y stock restaurado!')

  } catch (error) {
    console.error('❌ Error en el test:', error.message)
  }
}

function waitForEnter() {
  return new Promise((resolve) => {
    process.stdin.resume()
    process.stdin.setEncoding('utf8')
    process.stdin.once('data', () => {
      process.stdin.pause()
      resolve()
    })
  })
}

// Ejecutar test
testBajoPedido().catch(console.error)