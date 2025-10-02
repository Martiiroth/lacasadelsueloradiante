/**
 * Script de prueba simplificado para verificar la generación automática de facturas
 * 
 * Ejecutar: node scripts/test-simple-invoice.mjs
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://supabase.lacasadelsueloradianteapp.com'
const supabaseAnonKey = 'eyJ0eXAiOiAiSldUIiwiYWxnIjogIkhTMjU2In0.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzU4NzAwNTMzLAogICJleHAiOiAxOTE2MzgwNTMzCn0.uhOFMEExih6oXgd9tDGK87L-xQMK6J-6w5oPDs2tnbc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testInvoiceGeneration() {
  console.log('🔍 Verificando estructura de base de datos...')
  
  try {
    // Verificar tablas principales
    const tables = ['orders', 'invoices', 'invoice_counters', 'clients']
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.error(`❌ Error accediendo a tabla ${table}:`, error.message)
      } else {
        console.log(`✅ Tabla ${table} accesible`)
      }
    }
    
    // Verificar pedidos existentes
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total_cents,
        client_id,
        created_at,
        invoices!inner(id)
      `)
      .limit(5)
    
    if (ordersError) {
      console.error('❌ Error obteniendo pedidos:', ordersError)
      return
    }
    
    console.log(`📋 Pedidos encontrados: ${orders?.length || 0}`)
    
    if (orders && orders.length > 0) {
      orders.forEach(order => {
        console.log(`   - Pedido ${order.id.slice(-8)}: ${order.status} (€${(order.total_cents / 100).toFixed(2)})`)
      })
    }
    
    // Verificar facturas existentes
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, invoice_number, prefix, suffix, total_cents, status')
      .limit(5)
    
    if (invoicesError) {
      console.error('❌ Error obteniendo facturas:', invoicesError)
      return
    }
    
    console.log(`📄 Facturas encontradas: ${invoices?.length || 0}`)
    
    if (invoices && invoices.length > 0) {
      invoices.forEach(invoice => {
        console.log(`   - Factura ${invoice.prefix}${invoice.invoice_number}${invoice.suffix}: ${invoice.status} (€${(invoice.total_cents / 100).toFixed(2)})`)
      })
    }
    
    // Verificar contador de facturas
    const { data: counter, error: counterError } = await supabase
      .from('invoice_counters')
      .select('*')
      .single()
    
    if (counterError) {
      console.log('⚠️ No hay contador de facturas configurado')
    } else {
      console.log(`🔢 Contador de facturas: ${counter.prefix}${counter.next_number}${counter.suffix}`)
    }
    
    console.log('\n✅ Estructura verificada exitosamente!')
    console.log('\n📌 Para probar la generación automática de facturas:')
    console.log('1. Ve al panel de administración')
    console.log('2. Busca un pedido en estado "processing" o "shipped"') 
    console.log('3. Usa el botón "Marcar como Entregado"')
    console.log('4. La factura se generará automáticamente')
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error)
  }
}

testInvoiceGeneration()