import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkInvoices() {
  console.log('🔍 Verificando facturas en la base de datos...\n')
  
  try {
    // 1. Verificar facturas recientes
    const { data: recentInvoices, error } = await supabase
      .from('invoices')
      .select(`
        id,
        client_id,
        order_id,
        invoice_number,
        prefix,
        suffix,
        total_cents,
        created_at,
        clients (
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('❌ Error obteniendo facturas:', error)
      return
    }

    console.log(`📊 Últimas ${recentInvoices.length} facturas:`)
    recentInvoices.forEach((invoice, index) => {
      const number = `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`
      const client = invoice.clients
      console.log(`${index + 1}. ${number}`)
      console.log(`   Cliente: ${client?.first_name} ${client?.last_name} (${client?.email})`)
      console.log(`   Total: ${invoice.total_cents / 100}€`)
      console.log(`   Creada: ${invoice.created_at}`)
      console.log('')
    })

    // 2. Verificar la factura específica del log
    const specificInvoiceId = 'e9563b88-7f2c-48e5-8609-45cdd94a20ee'
    console.log(`🔍 Verificando factura específica ${specificInvoiceId}:`)
    
    const { data: specificInvoice, error: specificError } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', specificInvoiceId)
      .single()

    if (specificError || !specificInvoice) {
      console.log('❌ No se encontró la factura específica')
    } else {
      console.log('✅ Factura encontrada:')
      console.log(`   Número: ${specificInvoice.prefix}${specificInvoice.invoice_number}${specificInvoice.suffix}`)
      console.log(`   Cliente: ${specificInvoice.clients?.email}`)
      console.log(`   Total: ${specificInvoice.total_cents / 100}€`)
    }

    // 3. Verificar si el cliente puede ver sus facturas
    const clientId = '6b162c70-6325-4103-a53e-27a932b27d4e'
    console.log(`\n👤 Verificando facturas del cliente ${clientId}:`)
    
    const { data: clientInvoices, error: clientError } = await supabase
      .from('invoices')
      .select('id, prefix, invoice_number, suffix, total_cents, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (clientError) {
      console.error('❌ Error obteniendo facturas del cliente:', clientError)
    } else {
      console.log(`✅ Facturas del cliente: ${clientInvoices.length}`)
      clientInvoices.forEach(inv => {
        console.log(`   - ${inv.prefix}${inv.invoice_number}${inv.suffix} | ${inv.total_cents / 100}€ | ${inv.created_at}`)
      })
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

checkInvoices()