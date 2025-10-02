import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('📄 API: Obteniendo lista de facturas...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Obtener facturas con información del cliente
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients (
          first_name,
          last_name,
          email,
          company_name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching invoices:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invoices' },
        { status: 500 }
      )
    }

    console.log(`✅ Encontradas ${invoices?.length || 0} facturas`)
    if (invoices && invoices.length > 0) {
      console.log('📋 Primera factura:', {
        id: invoices[0].id,
        number: `${invoices[0].prefix}${invoices[0].invoice_number}${invoices[0].suffix}`,
        total: invoices[0].total_cents / 100,
        client: invoices[0].client
      })
    }

    return NextResponse.json({
      invoices: invoices || []
    })
  } catch (error) {
    console.error('Error in admin invoices API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}