const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugInvoicesComplete() {
  console.log('🔍 Diagnóstico completo del sistema de facturas...\n')
  
  try {
    // 1. Verificar si hay facturas en la base de datos
    console.log('1. 📊 Verificando facturas en la base de datos:')
    const { data: allInvoices, error: allInvoicesError } = await supabase
      .from('invoices')
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
      .order('created_at', { ascending: false })
      .limit(10)

    if (allInvoicesError) {
      console.error('❌ Error obteniendo facturas:', allInvoicesError)
      return
    }

    console.log(`   Total facturas encontradas: ${allInvoices.length}`)
    allInvoices.forEach((invoice, index) => {
      console.log(`   ${index + 1}. ID: ${invoice.id}`)
      console.log(`      Número: ${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`)
      console.log(`      Cliente: ${invoice.client_id}`)
      console.log(`      Pedido: ${invoice.order_id}`)
      console.log(`      Total: ${invoice.total_cents / 100}€`)
      console.log(`      Estado: ${invoice.status}`)
      console.log(`      Creada: ${invoice.created_at}`)
      console.log('')
    })

    if (allInvoices.length === 0) {
      console.log('   ⚠️ No hay facturas en la base de datos')
      return
    }

    // 2. Verificar el pedido específico del log
    console.log('2. 🔍 Verificando pedido específico be375861-e9fe-41d4-829a-03b92ce25a6b:')
    const orderId = 'be375861-e9fe-41d4-829a-03b92ce25a6b'
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        client_id,
        status,
        total_cents,
        created_at,
        updated_at
      `)
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('❌ Error obteniendo pedido:', orderError)
    } else {
      console.log('✅ Pedido encontrado:')
      console.log(`   ID: ${order.id}`)
      console.log(`   Cliente: ${order.client_id}`)
      console.log(`   Estado: ${order.status}`)
      console.log(`   Total: ${order.total_cents / 100}€`)
      console.log(`   Creado: ${order.created_at}`)
      console.log(`   Actualizado: ${order.updated_at}`)

      // 2a. Verificar factura para este pedido específico
      const { data: invoiceForOrder, error: invoiceOrderError } = await supabase
        .from('invoices')
        .select('*')
        .eq('order_id', orderId)

      if (invoiceOrderError) {
        console.error('❌ Error buscando factura del pedido:', invoiceOrderError)
      } else if (invoiceForOrder && invoiceForOrder.length > 0) {
        console.log('✅ Facturas para este pedido:')
        invoiceForOrder.forEach(invoice => {
          console.log(`   - ${invoice.prefix}${invoice.invoice_number}${invoice.suffix} (ID: ${invoice.id})`)
        })
      } else {
        console.log('❌ No hay facturas para este pedido')
      }

      // 2b. Verificar cliente del pedido
      if (order.client_id) {
        console.log(`\n   🧑‍💼 Verificando cliente ${order.client_id}:`)
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id, first_name, last_name, email, auth_uid')
          .eq('id', order.client_id)
          .single()

        if (clientError) {
          console.error('   ❌ Error obteniendo cliente:', clientError)
        } else {
          console.log(`   ✅ Cliente: ${client.first_name} ${client.last_name} (${client.email})`)
          console.log(`   ✅ Auth UID: ${client.auth_uid}`)

          // Verificar todas las facturas de este cliente
          const { data: clientInvoices, error: clientInvoicesError } = await supabase
            .from('invoices')
            .select('id, invoice_number, prefix, suffix, order_id, created_at')
            .eq('client_id', client.id)
            .order('created_at', { ascending: false })

          if (clientInvoicesError) {
            console.error('   ❌ Error obteniendo facturas del cliente:', clientInvoicesError)
          } else {
            console.log(`   📄 Facturas del cliente: ${clientInvoices.length}`)
            clientInvoices.forEach(inv => {
              console.log(`      - ${inv.prefix}${inv.invoice_number}${inv.suffix} | Pedido: ${inv.order_id} | ${inv.created_at}`)
            })
          }
        }
      }
    }

    // 3. Verificar contadores de facturas
    console.log('\n3. 🔢 Verificando contadores de facturas:')
    const { data: counters, error: counterError } = await supabase
      .from('invoice_counters')
      .select('*')

    if (counterError) {
      console.error('❌ Error obteniendo contadores:', counterError)
    } else if (counters && counters.length > 0) {
      console.log('✅ Contadores encontrados:')
      counters.forEach((counter, index) => {
        console.log(`   ${index + 1}. ID: ${counter.id}`)
        console.log(`      Prefijo: "${counter.prefix}"`)
        console.log(`      Sufijo: "${counter.suffix}"`)
        console.log(`      Próximo número: ${counter.next_number}`)
      })
    } else {
      console.log('❌ No hay contadores de facturas configurados')
    }

    // 4. Verificar la factura específica del error 404
    console.log('\n4. 🔍 Verificando factura específica del error 404:')
    const errorInvoiceId = '66a13e26-7fb4-4266-b271-cfd00fc4db88'
    
    const { data: errorInvoice, error: errorInvoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', errorInvoiceId)
      .single()

    if (errorInvoiceError || !errorInvoice) {
      console.log(`❌ La factura ${errorInvoiceId} NO existe en la base de datos`)
      console.log('   Esto explica el error 404')
    } else {
      console.log('✅ Factura encontrada:', errorInvoice)
    }

    // 5. Buscar patrones en las facturas existentes
    console.log('\n5. 📈 Análisis de patrones:')
    if (allInvoices.length > 0) {
      const prefixes = [...new Set(allInvoices.map(inv => inv.prefix))]
      const suffixes = [...new Set(allInvoices.map(inv => inv.suffix))]
      const statuses = [...new Set(allInvoices.map(inv => inv.status))]
      
      console.log(`   Prefijos utilizados: ${prefixes.join(', ') || 'ninguno'}`)
      console.log(`   Sufijos utilizados: ${suffixes.join(', ') || 'ninguno'}`)
      console.log(`   Estados: ${statuses.join(', ')}`)
      
      const numbers = allInvoices.map(inv => inv.invoice_number).sort((a, b) => a - b)
      console.log(`   Rango de números: ${numbers[0]} - ${numbers[numbers.length - 1]}`)
    }

  } catch (error) {
    console.error('❌ Error general en diagnóstico:', error)
  }
}

debugInvoicesComplete()