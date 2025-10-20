/**
 * Script para verificar el estado de la base de datos en producción
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabaseSchema() {
  console.log('🔍 Verificando esquema de base de datos en producción...\n');
  
  try {
    // 1. Verificar si existe la tabla invoices y sus columnas
    console.log('📋 1. Verificando estructura de tabla invoices:');
    
    // Intentar consultar con status (debería fallar si fue eliminado)
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, status, created_at')
        .limit(1);
      
      if (error) {
        console.log('✅ Campo status NO existe (correcto):', error.message);
      } else {
        console.log('❌ Campo status SÍ existe (incorrecto) - debe eliminarse');
        console.log('   Datos:', data);
      }
    } catch (error) {
      console.log('✅ Campo status eliminado correctamente');
    }

    // 2. Verificar facturas existentes con problemas de numeración
    console.log('\n📋 2. Verificando facturas problemáticas:');
    
    const { data: problematicInvoice } = await supabase
      .from('invoices')
      .select('id, prefix, invoice_number, suffix, order_id, created_at')
      .eq('prefix', 'W-')
      .eq('invoice_number', 67)
      .eq('suffix', '-25');
    
    if (problematicInvoice && problematicInvoice.length > 0) {
      console.log('❌ Factura duplicada encontrada:', problematicInvoice);
    } else {
      console.log('✅ No se encuentra la factura problemática W-67-25');
    }

    // 3. Verificar contador actual
    console.log('\n📋 3. Verificando contador de facturas:');
    
    const { data: counter } = await supabase
      .from('invoice_counters')
      .select('*');
    
    console.log('   Contadores:', counter);

    // 4. Verificar factura específica del error
    console.log('\n📋 4. Verificando pedido específico:');
    
    const { data: orderInvoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('order_id', 'be375861-e9fe-41d4-829a-03b92ce25a6b');
    
    console.log('   Facturas para pedido be375861:', orderInvoices);

    // 5. Verificar factura que no se puede visualizar
    console.log('\n📋 5. Verificando factura no visualizable:');
    
    const { data: invisibleInvoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', '5972abe7-b333-427a-b5b3-b459a11a187e');
    
    if (invisibleInvoice && invisibleInvoice.length > 0) {
      console.log('✅ Factura existe:', invisibleInvoice[0]);
    } else {
      console.log('❌ Factura NO existe en base de datos');
    }

  } catch (error) {
    console.error('❌ Error verificando esquema:', error.message);
  }
}

// Ejecutar verificación
checkDatabaseSchema().catch(console.error);