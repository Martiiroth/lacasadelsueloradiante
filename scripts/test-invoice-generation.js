// Script de prueba para cambiar estado de pedido a "entregado" y verificar generación de factura
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
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testInvoiceGeneration() {
  try {
    console.log('🔍 Buscando pedidos que no estén en estado "delivered"...')

    // Buscar un pedido que no esté en estado delivered
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total_cents,
        client_id,
        created_at,
        client:clients(
          first_name,
          last_name,
          email
        )
      `)
      .neq('status', 'delivered')
      .neq('status', 'cancelled')
      .limit(3)

    if (ordersError || !orders || orders.length === 0) {
      console.log('❌ No se encontraron pedidos disponibles para probar')
      console.log('Error:', ordersError)
      return
    }

    console.log(`✅ Encontrados ${orders.length} pedidos disponibles:`)
    orders.forEach((order, index) => {
      const clientName = order.client ? 
        `${order.client.first_name} ${order.client.last_name}` : 
        'Sin cliente'
      console.log(`   ${index + 1}. ${order.id} - Estado: ${order.status} - Cliente: ${clientName} - Total: €${(order.total_cents / 100).toFixed(2)}`)
    })

    // Usar el primer pedido para la prueba
    const testOrder = orders[0]
    console.log(`\n🧪 Probando con pedido: ${testOrder.id}`)

    // Verificar si ya tiene factura
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id, invoice_number, prefix, suffix, created_at')
      .eq('order_id', testOrder.id)
      .single()

    if (existingInvoice) {
      console.log(`⚠️ El pedido ya tiene una factura: ${existingInvoice.prefix}${existingInvoice.invoice_number}${existingInvoice.suffix}`)
    } else {
      console.log('✅ El pedido no tiene factura, perfecto para la prueba')
    }

    // Simular la llamada al API para cambiar el estado (esto es lo que haría el frontend)
    console.log('\n📡 Simulando llamada PUT al API para cambiar estado a "delivered"...')
    
    const apiUrl = 'http://localhost:3000/api/admin/orders/' + testOrder.id
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // En una aplicación real, aquí iría el token de autenticación
      },
      body: JSON.stringify({ status: 'delivered' })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ API respondió exitosamente:', result.message)
      
      // Esperar un momento y verificar si se creó la factura
      console.log('\n⏳ Esperando 2 segundos y verificando si se generó la factura...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const { data: newInvoice } = await supabase
        .from('invoices')
        .select('id, invoice_number, prefix, suffix, total_cents, created_at')
        .eq('order_id', testOrder.id)
        .single()

      if (newInvoice) {
        console.log('🎉 ¡ÉXITO! Se generó la factura automáticamente:')
        console.log(`   Número: ${newInvoice.prefix}${newInvoice.invoice_number}${newInvoice.suffix}`)
        console.log(`   Total: €${(newInvoice.total_cents / 100).toFixed(2)}`)
        console.log(`   Estado: ${newInvoice.status}`)
      } else {
        console.log('❌ No se generó la factura automáticamente')
      }
    } else {
      const error = await response.text()
      console.error('❌ Error en la API:', error)
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error)
  }
}

// Ejecutar test
console.log('🧪 Iniciando prueba de generación automática de facturas...\n')
testInvoiceGeneration()