const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugInvoices() {
  console.log('🔍 Debugging invoices system...')
  
  try {
    // 1. Verificar todas las facturas en la base de datos
    console.log('\n1. 📊 Verificando todas las facturas:')
    const { data: allInvoices, error: allInvoicesError } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })

    if (allInvoicesError) {
      console.error('❌ Error obteniendo facturas:', allInvoicesError)
    } else {
      console.log(`✅ Total de facturas en la base de datos: ${allInvoices.length}`)
      allInvoices.forEach(invoice => {
        console.log(`   - ${invoice.prefix}${invoice.invoice_number}${invoice.suffix} | Cliente: ${invoice.client_id} | Pedido: ${invoice.order_id} | Total: ${invoice.total_cents/100}€`)
      })
    }

    // 2. Verificar el pedido específico del error
    console.log('\n2. 🔍 Verificando el pedido específico:')
    const orderId = 'be375861-e9fe-41d4-829a-03b92ce25a6b'
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        client:clients (
          id, first_name, last_name, email
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('❌ Error obteniendo pedido:', orderError)
    } else {
      console.log('✅ Pedido encontrado:')
      console.log(`   - ID: ${order.id}`)
      console.log(`   - Estado: ${order.status}`)
      console.log(`   - Cliente: ${order.client?.first_name} ${order.client?.last_name} (${order.client?.email})`)
      console.log(`   - Total: ${order.total_cents/100}€`)
    }

    // 3. Verificar si existe factura para este pedido
    console.log('\n3. 🧾 Verificando factura para este pedido:')
    const { data: invoiceForOrder, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('order_id', orderId)

    if (invoiceError) {
      console.error('❌ Error buscando factura:', invoiceError)
    } else if (invoiceForOrder && invoiceForOrder.length > 0) {
      console.log('✅ Factura(s) encontrada(s) para este pedido:')
      invoiceForOrder.forEach(invoice => {
        console.log(`   - ID: ${invoice.id}`)
        console.log(`   - Número: ${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`)
        console.log(`   - Cliente: ${invoice.client_id}`)
        console.log(`   - Total: ${invoice.total_cents/100}€`)
        console.log(`   - Creada: ${invoice.created_at}`)
      })
    } else {
      console.log('❌ No se encontró factura para este pedido')
    }

    // 4. Verificar contador de facturas
    console.log('\n4. 🔢 Verificando contador de facturas:')
    const { data: counter, error: counterError } = await supabase
      .from('invoice_counters')
      .select('*')

    if (counterError) {
      console.error('❌ Error obteniendo contador:', counterError)
    } else if (counter && counter.length > 0) {
      console.log('✅ Contador de facturas:')
      counter.forEach(c => {
        console.log(`   - Prefijo: ${c.prefix}`)
        console.log(`   - Sufijo: ${c.suffix}`)
        console.log(`   - Próximo número: ${c.next_number}`)
      })
    } else {
      console.log('❌ No existe contador de facturas')
    }

    // 5. Verificar facturas de un cliente específico
    if (order && order.client_id) {
      console.log(`\n5. 👤 Verificando facturas del cliente ${order.client_id}:`)
      const { data: clientInvoices, error: clientInvoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', order.client_id)
        .order('created_at', { ascending: false })

      if (clientInvoicesError) {
        console.error('❌ Error obteniendo facturas del cliente:', clientInvoicesError)
      } else {
        console.log(`✅ Facturas del cliente: ${clientInvoices.length}`)
        clientInvoices.forEach(invoice => {
          console.log(`   - ${invoice.prefix}${invoice.invoice_number}${invoice.suffix} | Pedido: ${invoice.order_id} | Total: ${invoice.total_cents/100}€`)
        })
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

debugInvoices()