import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { order_id } = body

    if (!order_id) {
      return NextResponse.json({
        success: false,
        error: 'order_id requerido'
      }, { status: 400 })
    }

    // Configuración de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    console.log('🔧 [DEBUG] Supabase config:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlLength: supabaseUrl?.length,
      keyLength: supabaseKey?.length
    })

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test 1: Verificar conectividad básica
    console.log('🔍 [DEBUG] Test 1: Verificar conectividad con Supabase...')
    const { data: testData, error: testError } = await supabase
      .from('orders')
      .select('id')
      .limit(1)

    console.log('📊 [DEBUG] Test conectividad:', { hasData: !!testData, error: testError?.message })

    // Test 2: Buscar el pedido específico
    console.log('🔍 [DEBUG] Test 2: Buscar pedido específico:', order_id)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, client_id, status, total_cents')
      .eq('id', order_id)
      .single()

    console.log('📊 [DEBUG] Pedido encontrado:', { 
      hasOrder: !!order, 
      status: order?.status,
      errorCode: orderError?.code,
      errorMessage: orderError?.message 
    })

    // Test 3: Verificar tabla de facturas
    console.log('🔍 [DEBUG] Test 3: Verificar acceso a tabla de facturas...')
    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select('id')
      .limit(1)

    console.log('📊 [DEBUG] Acceso facturas:', { hasData: !!invoices, error: invoiceError?.message })

    return NextResponse.json({
      success: true,
      debug: {
        supabase_config: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          urlLength: supabaseUrl?.length,
          keyLength: supabaseKey?.length
        },
        connectivity_test: {
          hasData: !!testData,
          error: testError?.message || null
        },
        order_lookup: {
          found: !!order,
          status: order?.status || null,
          error: orderError?.message || null,
          errorCode: orderError?.code || null
        },
        invoice_access: {
          hasAccess: !!invoices,
          error: invoiceError?.message || null
        }
      }
    })

  } catch (error) {
    console.error('❌ [DEBUG] Error general:', error)
    return NextResponse.json({
      success: false,
      error: 'Error en debug',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}