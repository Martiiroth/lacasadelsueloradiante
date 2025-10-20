const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupInvoiceCounter() {
  console.log('🔧 Configurando contador de facturas en public.invoice_counters...\n')
  
  try {
    // 1. Verificar contador actual
    const { data: counters, error: selectError } = await supabase
      .from('invoice_counters')
      .select('*')

    if (selectError) {
      console.error('❌ Error consultando contador:', selectError)
      return
    }

    console.log('Contadores actuales:', counters)

    if (counters && counters.length > 0) {
      // Ya existe un contador, verificar si necesita actualización
      const counter = counters[0]
      console.log(`Contador existente: ${counter.prefix}${counter.next_number}${counter.suffix}`)
      
      if (counter.prefix !== 'W-' || counter.suffix !== '-25') {
        console.log('Actualizando contador existente...')
        
        // Buscar el último número usado
        const { data: lastInvoice } = await supabase
          .from('invoices')
          .select('invoice_number')
          .eq('prefix', 'W-')
          .eq('suffix', '-25')
          .order('invoice_number', { ascending: false })
          .limit(1)

        let nextNumber = 71 // Por defecto usar 71 (después de W-70-25)
        if (lastInvoice && lastInvoice.length > 0) {
          nextNumber = lastInvoice[0].invoice_number + 1
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
          console.log(`✅ Contador actualizado: próxima factura será W-${nextNumber}-25`)
        }
      } else {
        console.log('✅ Contador ya configurado correctamente')
      }
    } else {
      // No existe contador, crear uno nuevo
      console.log('Creando contador nuevo...')
      
      // Buscar el último número usado
      const { data: lastInvoice } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('prefix', 'W-')
        .eq('suffix', '-25')
        .order('invoice_number', { ascending: false })
        .limit(1)

      let nextNumber = 71 // Por defecto usar 71
      if (lastInvoice && lastInvoice.length > 0) {
        nextNumber = lastInvoice[0].invoice_number + 1
        console.log(`Último número encontrado: ${lastInvoice[0].invoice_number}`)
      }

      const { error: insertError } = await supabase
        .from('invoice_counters')
        .insert({
          prefix: 'W-',
          suffix: '-25',
          next_number: nextNumber
        })

      if (insertError) {
        console.error('❌ Error creando contador:', insertError)
      } else {
        console.log(`✅ Contador creado: próxima factura será W-${nextNumber}-25`)
      }
    }

    // Verificar el resultado final
    const { data: finalCounters } = await supabase
      .from('invoice_counters')
      .select('*')

    console.log('\nConfiguración final del contador:')
    finalCounters?.forEach(counter => {
      console.log(`- ID: ${counter.id}`)
      console.log(`- Formato: ${counter.prefix}[NÚMERO]${counter.suffix}`)
      console.log(`- Próxima factura: ${counter.prefix}${counter.next_number}${counter.suffix}`)
    })

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

setupInvoiceCounter()