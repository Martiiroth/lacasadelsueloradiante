import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params
    
    console.log('🔍 Invoice Request - Invoice ID:', invoiceId)
    console.log('🔍 Invoice Request - URL:', request.url)
    
    if (!invoiceId) {
      console.error('❌ Invoice Request - No invoice ID provided')
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('📄 API: Obteniendo detalles de la factura:', invoiceId)

    // Primero verificar si la factura existe en la tabla
    const { data: basicInvoice, error: basicError } = await supabase
      .from('invoices')
      .select('id, client_id, order_id, prefix, invoice_number, suffix')
      .eq('id', invoiceId)
      .single()

    if (basicError || !basicInvoice) {
      console.error('❌ Factura no encontrada en verificación básica:', {
        invoiceId,
        error: basicError?.message
      })
      return NextResponse.json(
        { error: 'Invoice not found', debug: { invoiceId, step: 'basic_lookup' } },
        { status: 404 }
      )
    }

    console.log('✅ Factura encontrada:', `${basicInvoice.prefix}${basicInvoice.invoice_number}${basicInvoice.suffix}`)

    // Obtener factura específica con información del cliente y pedido
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients (
          first_name,
          last_name,
          email,
          phone,
          address_line1,
          address_line2,
          city,
          region,
          postal_code,
          company_name,
          nif_cif
        ),
        order:orders (
          id,
          created_at,
          shipping_address,
          billing_address,
          order_items (
            id,
            qty,
            price_cents,
            variant:product_variants (
              id,
              title,
              sku,
              product:products (
                title
              )
            )
          )
        )
      `)
      .eq('id', invoiceId)
      .single()

    if (error) {
      console.error('❌ Error fetching invoice:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        invoiceId
      })
      return NextResponse.json(
        { error: 'Invoice not found', debug: { invoiceId, error: error.message } },
        { status: 404 }
      )
    }

    if (!invoice) {
      console.error('❌ Invoice not found with ID:', invoiceId)
      console.error('No data returned from database query')
      return NextResponse.json(
        { error: 'Invoice not found', debug: { invoiceId, reason: 'no_data' } },
        { status: 404 }
      )
    }

    console.log('✅ Factura encontrada:', {
      id: invoice.id,
      number: `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`,
      total: invoice.total_cents / 100,
      client: invoice.client ? `${invoice.client.first_name} ${invoice.client.last_name}` : 'No client',
      order_items: invoice.order?.order_items?.length || 0
    })

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