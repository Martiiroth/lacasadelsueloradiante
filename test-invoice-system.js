/**
 * Script de prueba para verificar el sistema de facturas
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testInvoiceSystem() {
  console.log('🔍 Verificando sistema de facturas...\n');
  
  // 1. Verificar estructura de tablas
  console.log('📋 1. Verificando estructura de la tabla invoices:');
  try {
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .limit(1);
    
    if (invoicesError) {
      console.error('❌ Error consultando invoices:', invoicesError.message);
    } else {
      console.log('✅ Tabla invoices accesible');
      if (invoices && invoices.length > 0) {
        console.log('   Campos disponibles:', Object.keys(invoices[0]));
      } else {
        console.log('   No hay facturas en la tabla');
      }
    }
  } catch (error) {
    console.error('❌ Error verificando tabla invoices:', error.message);
  }

  console.log('\n📋 2. Verificando estructura de la tabla invoice_counters:');
  try {
    const { data: counters, error: countersError } = await supabase
      .from('invoice_counters')
      .select('*');
    
    if (countersError) {
      console.error('❌ Error consultando invoice_counters:', countersError.message);
    } else {
      console.log('✅ Tabla invoice_counters accesible');
      console.log(`   Contadores encontrados: ${counters?.length || 0}`);
      if (counters && counters.length > 0) {
        counters.forEach(counter => {
          console.log(`   - ${counter.prefix}${counter.next_number}${counter.suffix}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Error verificando tabla invoice_counters:', error.message);
  }

  // 3. Verificar pedidos entregados sin factura
  console.log('\n📦 3. Verificando pedidos entregados:');
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total_cents,
        created_at,
        client_id,
        client:clients(first_name, last_name, email)
      `)
      .eq('status', 'delivered')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (ordersError) {
      console.error('❌ Error consultando pedidos:', ordersError.message);
    } else {
      console.log(`✅ Pedidos entregados encontrados: ${orders?.length || 0}`);
      
      if (orders && orders.length > 0) {
        for (const order of orders) {
          // Verificar si tiene factura
          const { data: invoice } = await supabase
            .from('invoices')
            .select('id, invoice_number, prefix, suffix, created_at')
            .eq('order_id', order.id)
            .single();
          
          console.log(`   📦 Pedido ${order.id}:`);
          console.log(`      - Cliente: ${order.client?.first_name} ${order.client?.last_name}`);
          console.log(`      - Total: €${(order.total_cents / 100).toFixed(2)}`);
          console.log(`      - Fecha: ${new Date(order.created_at).toLocaleDateString()}`);
          if (invoice) {
            console.log(`      - ✅ Factura: ${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`);
            console.log(`      - Factura creada: ${new Date(invoice.created_at).toLocaleDateString()}`);
          } else {
            console.log(`      - ❌ SIN FACTURA`);
          }
          console.log('');
        }
      }
    }
  } catch (error) {
    console.error('❌ Error verificando pedidos:', error.message);
  }

  // 4. Verificar facturas existentes
  console.log('\n📄 4. Verificando facturas existentes:');
  try {
    const { data: allInvoices, error: allInvoicesError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        prefix,
        suffix,
        total_cents,
        created_at,
        order_id,
        client:clients(first_name, last_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (allInvoicesError) {
      console.error('❌ Error consultando todas las facturas:', allInvoicesError.message);
    } else {
      console.log(`✅ Total de facturas: ${allInvoices?.length || 0}`);
      
      if (allInvoices && allInvoices.length > 0) {
        allInvoices.forEach((invoice, index) => {
          console.log(`   ${index + 1}. ${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`);
          console.log(`      - Cliente: ${invoice.client?.first_name} ${invoice.client?.last_name}`);
          console.log(`      - Total: €${(invoice.total_cents / 100).toFixed(2)}`);
          console.log(`      - Pedido: ${invoice.order_id}`);
          console.log(`      - Creada: ${new Date(invoice.created_at).toLocaleDateString()}`);
          console.log('');
        });
      }
    }
  } catch (error) {
    console.error('❌ Error verificando todas las facturas:', error.message);
  }

  console.log('🔍 Verificación del sistema de facturas completada.\n');
}

// Ejecutar el test
testInvoiceSystem().catch(console.error);