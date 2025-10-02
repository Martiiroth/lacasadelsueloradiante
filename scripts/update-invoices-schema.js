const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function updateInvoicesSchema() {
  console.log('🔄 Verificando esquema de invoices...')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // Intentar obtener una factura para ver qué campos existen
    console.log('🔍 Consultando facturas existentes para verificar estructura...')
    
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Error consultando invoices:', error)
      return
    }

    if (invoices && invoices.length > 0) {
      console.log('📋 Estructura actual de la tabla invoices:')
      const sampleInvoice = invoices[0]
      Object.keys(sampleInvoice).forEach(field => {
        console.log(`   - ${field}: ${typeof sampleInvoice[field]}`)
      })
      
      if ('status' in sampleInvoice) {
        console.log('⚠️  ENCONTRADO: Campo "status" existe y debe eliminarse')
        console.log('📝 SQL requerido: ALTER TABLE public.invoices DROP COLUMN status;')
      } else {
        console.log('✅ Campo "status" no existe. Esquema correcto.')
      }
    } else {
      console.log('ℹ️  No hay facturas en la base de datos para verificar')
    }
    
  } catch (err) {
    console.error('❌ Error ejecutando script:', err)
  }
}

updateInvoicesSchema()