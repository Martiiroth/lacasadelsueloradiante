const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixInvoiceCounter() {
  console.log('🔧 Corrigiendo contador de facturas...\n')
  
  try {
    // 1. Verificar contador actual
    console.log('1. Verificando contador actual:')
    const { data: currentCounters, error: counterError } = await supabase
      .from('invoice_counters')
      .select('*')

    if (counterError) {
      console.error('❌ Error obteniendo contadores:', counterError)
      return
    }

    if (currentCounters && currentCounters.length > 0) {
      console.log('✅ Contadores encontrados:')
      currentCounters.forEach(counter => {
        console.log(`   - Prefijo: "${counter.prefix}", Sufijo: "${counter.suffix}", Próximo: ${counter.next_number}`)
      })

      // Si hay un contador con prefijo incorrecto, corregirlo
      for (const counter of currentCounters) {
        if (counter.prefix !== 'W-' || counter.suffix !== '-25') {
          console.log(`\n2. Corrigiendo contador ${counter.id}:`)
          
          // Obtener el máximo número de factura con prefijo W-
          const { data: maxInvoices } = await supabase
            .from('invoices')
            .select('invoice_number')
            .eq('prefix', 'W-')
            .eq('suffix', '-25')
            .order('invoice_number', { ascending: false })
            .limit(1)

          let nextNumber = 1
          if (maxInvoices && maxInvoices.length > 0) {
            nextNumber = maxInvoices[0].invoice_number + 1
            console.log(`   Último número usado: ${maxInvoices[0].invoice_number}`)
          }

          const { error: updateError } = await supabase
            .from('invoice_counters')
            .update({
              prefix: 'W-',
              suffix: '-25',
              next_number: nextNumber
            })
            .eq('id', counter.id)

          if (updateError) {
            console.error('❌ Error actualizando contador:', updateError)
          } else {
            console.log(`✅ Contador corregido: W-${nextNumber}-25 será la próxima factura`)
          }
        }
      }
    } else {
      // No hay contadores, crear uno nuevo
      console.log('2. No hay contadores, creando uno nuevo:')
      
      // Obtener el máximo número de factura con prefijo W-
      const { data: maxInvoices } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('prefix', 'W-')
        .eq('suffix', '-25')
        .order('invoice_number', { ascending: false })
        .limit(1)

      let nextNumber = 1
      if (maxInvoices && maxInvoices.length > 0) {
        nextNumber = maxInvoices[0].invoice_number + 1
        console.log(`   Último número usado: ${maxInvoices[0].invoice_number}`)
      }

      const { error: createError } = await supabase
        .from('invoice_counters')
        .insert({
          prefix: 'W-',
          suffix: '-25',
          next_number: nextNumber
        })

      if (createError) {
        console.error('❌ Error creando contador:', createError)
      } else {
        console.log(`✅ Contador creado: W-${nextNumber}-25 será la próxima factura`)
      }
    }

    // 3. Verificar facturas existentes
    console.log('\n3. Verificando facturas existentes:')
    const { data: recentInvoices } = await supabase
      .from('invoices')
      .select('id, prefix, invoice_number, suffix, client_id, order_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentInvoices && recentInvoices.length > 0) {
      console.log('✅ Últimas facturas:')
      recentInvoices.forEach(invoice => {
        console.log(`   - ${invoice.prefix}${invoice.invoice_number}${invoice.suffix} | Cliente: ${invoice.client_id?.slice(0, 8)}... | ${invoice.created_at}`)
      })
    } else {
      console.log('⚠️ No hay facturas en el sistema')
    }

    // 4. Verificar que no haya facturas huérfanas (sin client_id)
    console.log('\n4. Verificando facturas sin cliente:')
    const { data: orphanInvoices } = await supabase
      .from('invoices')
      .select('id, prefix, invoice_number, suffix, order_id')
      .is('client_id', null)

    if (orphanInvoices && orphanInvoices.length > 0) {
      console.log('⚠️ Facturas sin client_id encontradas:')
      orphanInvoices.forEach(invoice => {
        console.log(`   - ${invoice.prefix}${invoice.invoice_number}${invoice.suffix} | Pedido: ${invoice.order_id}`)
      })
      
      // Intentar corregir asociando el client_id del pedido
      for (const invoice of orphanInvoices) {
        if (invoice.order_id) {
          const { data: order } = await supabase
            .from('orders')
            .select('client_id')
            .eq('id', invoice.order_id)
            .single()

          if (order && order.client_id) {
            const { error: fixError } = await supabase
              .from('invoices')
              .update({ client_id: order.client_id })
              .eq('id', invoice.id)

            if (fixError) {
              console.error(`   ❌ Error corrigiendo factura ${invoice.id}:`, fixError)
            } else {
              console.log(`   ✅ Factura ${invoice.prefix}${invoice.invoice_number}${invoice.suffix} asociada a cliente ${order.client_id.slice(0, 8)}...`)
            }
          }
        }
      }
    } else {
      console.log('✅ Todas las facturas tienen client_id')
    }

    console.log('\n🎉 Corrección de contador completada')

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

fixInvoiceCounter()