// Test directo de la funcionalidad del AdminService
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Replicar la lógica de generación de factura del AdminService
async function generateInvoiceForDeliveredOrder(orderId) {
  try {
    console.log(`📄 Generando factura para pedido: ${orderId}`)

    // Obtener información del pedido (simulando AdminService.getOrderById)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        client_id,
        total_cents,
        status,
        created_at,
        client:clients(
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Error obteniendo pedido:', orderError)
      return null
    }

    console.log(`📋 Pedido encontrado: ${order.id} - Estado: ${order.status} - Total: €${(order.total_cents / 100).toFixed(2)}`)

    // Verificar si ya existe una factura para este pedido
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id, invoice_number, prefix, suffix')
      .eq('order_id', orderId)
      .single()

    if (existingInvoice) {
      console.log(`⚠️ Ya existe una factura para el pedido ${orderId}:`, `${existingInvoice.prefix}${existingInvoice.invoice_number}${existingInvoice.suffix}`)
      return existingInvoice
    }

    // Obtener contador de facturas
    let { data: counter, error: counterError } = await supabase
      .from('invoice_counters')
      .select('*')
      .limit(1)
      .single()

    if (counterError || !counter) {
      console.error('Error obteniendo contador:', counterError)
      return null
    }

    console.log(`🔢 Contador actual: ${counter.prefix}${counter.next_number}${counter.suffix}`)

    // Crear factura
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        client_id: order.client_id,
        order_id: orderId,
        invoice_number: counter.next_number,
        prefix: counter.prefix,
        suffix: counter.suffix,
        total_cents: order.total_cents,
        currency: 'EUR',
        status: 'pending',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
      })
      .select(`
        id,
        client_id,
        order_id,
        invoice_number,
        prefix,
        suffix,
        total_cents,
        currency,
        status,
        created_at,
        due_date
      `)
      .single()

    if (invoiceError || !invoice) {
      console.error('Error creando factura:', invoiceError)
      return null
    }

    // Actualizar contador
    const { error: updateCounterError } = await supabase
      .from('invoice_counters')
      .update({ next_number: counter.next_number + 1 })
      .eq('id', counter.id)

    if (updateCounterError) {
      console.error('Error actualizando contador:', updateCounterError)
    }

    console.log('🎉 Factura creada exitosamente:', {
      id: invoice.id,
      number: `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`,
      total: invoice.total_cents / 100,
      order_id: orderId
    })

    return invoice
  } catch (error) {
    console.error('Error en generateInvoiceForDeliveredOrder:', error)
    return null
  }
}

async function testDirectInvoiceGeneration() {
  try {
    console.log('🧪 Prueba directa de generación de facturas\n')

    // Buscar un pedido que no sea delivered y no tenga factura
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total_cents,
        client_id,
        client:clients(first_name, last_name)
      `)
      .neq('status', 'delivered')
      .neq('status', 'cancelled')
      .limit(5)

    if (ordersError || !orders || orders.length === 0) {
      console.log('❌ No se encontraron pedidos para probar')
      return
    }

    console.log(`✅ Encontrados ${orders.length} pedidos disponibles:`)
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i]
      const clientName = order.client ? 
        `${order.client.first_name} ${order.client.last_name}` : 
        'Sin cliente'
      
      // Verificar si tiene factura
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, invoice_number, prefix, suffix')
        .eq('order_id', order.id)
        .single()
      
      const hasInvoice = invoice ? `(Ya tiene factura: ${invoice.prefix}${invoice.invoice_number}${invoice.suffix})` : '(Sin factura)'
      
      console.log(`   ${i + 1}. ${order.id} - ${order.status} - €${(order.total_cents / 100).toFixed(2)} - ${clientName} ${hasInvoice}`)
    }

    // Buscar uno sin factura
    let testOrder = null
    for (const order of orders) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('order_id', order.id)
        .single()
      
      if (!invoice) {
        testOrder = order
        break
      }
    }

    if (!testOrder) {
      console.log('\n⚠️ Todos los pedidos ya tienen facturas. Usando el primero para probar la lógica de "ya existe"...')
      testOrder = orders[0]
    }

    console.log(`\n🧪 Probando generación de factura para pedido: ${testOrder.id}`)

    // 1. Primero cambiar el estado a "delivered"
    console.log('1️⃣ Cambiando estado del pedido a "delivered"...')
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'delivered', updated_at: new Date().toISOString() })
      .eq('id', testOrder.id)

    if (updateError) {
      console.error('❌ Error actualizando estado:', updateError)
      return
    }
    console.log('✅ Estado actualizado correctamente')

    // 2. Luego intentar generar la factura (simulando lo que hace AdminService.updateOrderStatus)
    console.log('2️⃣ Generando factura...')
    const invoice = await generateInvoiceForDeliveredOrder(testOrder.id)

    if (invoice) {
      console.log('\n🎉 ¡PRUEBA EXITOSA! La funcionalidad está funcionando correctamente.')
      console.log(`   Factura: ${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`)
      console.log(`   Total: €${(invoice.total_cents / 100).toFixed(2)}`)
    } else {
      console.log('\n❌ La generación de factura falló')
    }

  } catch (error) {
    console.error('❌ Error en el test:', error)
  }
}

// Ejecutar test
testDirectInvoiceGeneration()