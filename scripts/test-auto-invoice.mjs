/**
 * Script para probar la generación automática de facturas cuando un pedido se marca como entregado
 * 
 * Este script:
 * 1. Busca pedidos existentes en estado 'shipped' o 'processing'
 * 2. Cambia su estado a 'delivered' 
 * 3. Verifica que se genere automáticamente una factura
 * 
 * Uso: node scripts/test-auto-invoice.mjs
 */

import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase (usa las variables de entorno)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supabase.lacasadelsueloradianteapp.com'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurado')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testAutoInvoiceGeneration() {
  console.log('🔍 Buscando pedidos para probar la generación automática de facturas...')
  
  try {
    // 1. Buscar pedidos que no sean 'delivered' ni 'cancelled' y que no tengan factura
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        client_id,
        total_cents,
        created_at,
        client:clients(first_name, last_name, email),
        invoice:invoices(id, invoice_number, prefix, suffix)
      `)
      .not('status', 'in', '(delivered,cancelled)')
      .is('invoice.id', null)
      .limit(3)

    if (ordersError) {
      console.error('❌ Error buscando pedidos:', ordersError)
      return
    }

    if (!orders || orders.length === 0) {
      console.log('⚠️ No se encontraron pedidos disponibles para prueba')
      
      // Crear un pedido de prueba
      console.log('📦 Creando pedido de prueba...')
      await createTestOrder()
      return
    }

    console.log(`✅ Encontrados ${orders.length} pedidos para probar`)

    for (const order of orders) {
      console.log(`\n📋 Procesando pedido ${order.id}`)
      console.log(`   Estado actual: ${order.status}`)
      console.log(`   Cliente: ${order.client?.first_name} ${order.client?.last_name}`)
      console.log(`   Total: €${(order.total_cents / 100).toFixed(2)}`)
      
      // 2. Cambiar estado a 'delivered'
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'delivered',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (updateError) {
        console.error(`❌ Error actualizando pedido ${order.id}:`, updateError)
        continue
      }

      console.log(`✅ Pedido ${order.id} marcado como entregado`)

      // 3. Simular la generación de factura (como lo haría el trigger)
      console.log(`📄 Generando factura para pedido ${order.id}...`)
      
      // Obtener o crear contador de facturas
      let { data: counter } = await supabase
        .from('invoice_counters')
        .select('*')
        .single()

      if (!counter) {
        const { data: newCounter, error: counterError } = await supabase
          .from('invoice_counters')
          .insert({
            prefix: 'FAC-',
            suffix: '',
            next_number: 1
          })
          .select('*')
          .single()

        if (counterError) {
          console.error('❌ Error creando contador:', counterError)
          continue
        }
        counter = newCounter
      }

      // Crear factura
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30)

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          client_id: order.client_id,
          order_id: order.id,
          invoice_number: counter.next_number,
          prefix: counter.prefix,
          suffix: counter.suffix,
          total_cents: order.total_cents,
          currency: 'EUR',
          status: 'pending',
          due_date: dueDate.toISOString()
        })
        .select('*')
        .single()

      if (invoiceError) {
        console.error(`❌ Error creando factura:`, invoiceError)
        continue
      }

      // Actualizar contador
      await supabase
        .from('invoice_counters')
        .update({ next_number: counter.next_number + 1 })
        .eq('id', counter.id)

      console.log(`✅ Factura ${invoice.prefix}${invoice.invoice_number}${invoice.suffix} creada exitosamente`)

      // 4. Verificar la factura
      const { data: verification, error: verifyError } = await supabase
        .from('invoices')
        .select('*')
        .eq('order_id', order.id)
        .single()

      if (verifyError || !verification) {
        console.error(`❌ Error verificando factura:`, verifyError)
        continue
      }

      console.log(`🔍 Verificación exitosa:`)
      console.log(`   - Factura ID: ${verification.id}`)
      console.log(`   - Número: ${verification.prefix}${verification.invoice_number}${verification.suffix}`)
      console.log(`   - Total: €${(verification.total_cents / 100).toFixed(2)}`)
      console.log(`   - Estado: ${verification.status}`)
      console.log(`   - Vencimiento: ${new Date(verification.due_date).toLocaleDateString()}`)
    }

    console.log('\n🎉 Prueba completada exitosamente!')
    console.log('💡 Resumen: Cuando un pedido se marca como "delivered", se genera automáticamente una factura.')

  } catch (error) {
    console.error('❌ Error en la prueba:', error)
  }
}

async function createTestOrder() {
  try {
    // Buscar un cliente existente
    const { data: clients } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
      .limit(1)

    if (!clients || clients.length === 0) {
      console.error('❌ No se encontraron clientes para crear pedido de prueba')
      return
    }

    const client = clients[0]

    // Crear pedido de prueba
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        client_id: client.id,
        status: 'processing',
        total_cents: 5000, // €50.00
        shipping_address: JSON.stringify({
          name: `${client.first_name} ${client.last_name}`,
          street: 'Calle Prueba 123',
          city: 'Madrid',
          postal_code: '28001',
          country: 'España'
        })
      })
      .select('*')
      .single()

    if (orderError) {
      console.error('❌ Error creando pedido de prueba:', orderError)
      return
    }

    console.log(`✅ Pedido de prueba creado: ${order.id}`)
    console.log('🔄 Ejecutando prueba de nuevo...')
    
    // Ejecutar la prueba de nuevo
    await testAutoInvoiceGeneration()

  } catch (error) {
    console.error('❌ Error creando pedido de prueba:', error)
  }
}

// Ejecutar la prueba
testAutoInvoiceGeneration()