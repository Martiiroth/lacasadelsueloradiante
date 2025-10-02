import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params
    
    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Obtener factura específica con información del cliente
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:client_id (
          first_name,
          last_name,
          email,
          phone,
          address_line1,
          company_name,
          nif_cif
        )
      `)
      .eq('id', invoiceId)
      .single()

    if (error) {
      console.error('Error fetching invoice:', error)
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      invoice
    })
  } catch (error) {
    console.error('Error in invoice detail API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}