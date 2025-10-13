#!/usr/bin/env node

// Script rápido para poner un producto en stock 0 y probar
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testStock0() {
  console.log('🧪 Poniendo producto en stock 0 para test...\n')

  try {
    // Buscar primer producto
    const { data: variant, error } = await supabase
      .from('product_variants')
      .select('id, sku, title, stock, product:products(title)')
      .limit(1)
      .single()

    if (error || !variant) {
      console.error('❌ No se encontró producto:', error)
      return
    }

    const originalStock = variant.stock
    
    console.log(`📦 Producto: ${variant.product?.title} - ${variant.title}`)
    console.log(`🔢 Stock actual: ${originalStock}`)

    // Poner en stock 0
    const { error: updateError } = await supabase
      .from('product_variants')
      .update({ stock: 0 })
      .eq('id', variant.id)

    if (updateError) {
      console.error('❌ Error:', updateError)
      return
    }

    console.log('✅ Stock cambiado a 0')
    console.log('\n🎯 AHORA PUEDES PROBAR:')
    console.log('1. Ve a la web')
    console.log('2. Busca este producto')
    console.log('3. Debería decir "Bajo pedido"')
    console.log('4. Añádelo al carrito - DEBERÍA FUNCIONAR ✅')
    console.log('\n⚠️  Producto afectado:', variant.sku)
    console.log('💡 Ejecuta el script otra vez para restaurar el stock\n')

    console.log('⏳ Presiona Ctrl+C cuando termines de probar...')

    // Esperar 60 segundos y restaurar automáticamente
    setTimeout(async () => {
      console.log('\n🔄 Restaurando stock automáticamente...')
      
      const { error: restoreError } = await supabase
        .from('product_variants')
        .update({ stock: originalStock })
        .eq('id', variant.id)

      if (restoreError) {
        console.error('❌ Error restaurando:', restoreError)
      } else {
        console.log(`✅ Stock restaurado a ${originalStock}`)
      }
      
      process.exit(0)
    }, 60000)

  } catch (error) {
    console.error('💥 Error:', error.message)
  }
}

testStock0()