import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { AdminService } from '@/lib/adminService'
import ServerEmailService from '@/lib/emailService.server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    console.log('📧 API: Enviando email de cambio de estado para pedido:', id)
    
    // Verificación de autenticación
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ API: Usuario no autenticado:', authError?.message)
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que el usuario es admin
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('customer_role:customer_roles(*)')
      .eq('auth_uid', user.id)
      .single()

    if (clientError || !client) {
      console.error('❌ API: Error obteniendo cliente:', clientError?.message)
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      )
    }

    const isAdmin = (client?.customer_role as any)?.name === 'admin'
    if (!isAdmin) {
      console.error('❌ API: Usuario no es admin:', user.email)
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { status, recipients = 'both' } = body

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status es requerido' },
        { status: 400 }
      )
    }

    // Obtener detalles del pedido
    const orderDetails = await AdminService.getOrderById(id)
    if (!orderDetails) {
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    // Preparar datos para el email
    const clientName = orderDetails.client ? 
      `${orderDetails.client.first_name} ${orderDetails.client.last_name}`.trim() : 
      'Cliente'
    
    const clientEmail = orderDetails.client?.email || (orderDetails as any).guest_email || ''
    
    // Construir dirección de envío
    let shippingAddress = undefined;
    if (orderDetails.shipping_address) {
      if (typeof orderDetails.shipping_address === 'string') {
        try {
          const parsed = JSON.parse(orderDetails.shipping_address);
          shippingAddress = parsed.shipping || parsed;
        } catch {
          shippingAddress = orderDetails.shipping_address;
        }
      } else if (typeof orderDetails.shipping_address === 'object') {
        shippingAddress = orderDetails.shipping_address.shipping || orderDetails.shipping_address;
      }
    }

    // Construir dirección de facturación
    let billingAddress = undefined;
    if (orderDetails.billing_address) {
      billingAddress = typeof orderDetails.billing_address === 'string'
        ? orderDetails.billing_address
        : JSON.stringify(orderDetails.billing_address, null, 2);
    }

    // Obtener clientInfo
    let clientInfo = undefined
    if (orderDetails.client_id) {
      const { supabase: supabaseClient } = await import('@/lib/supabase')
      const { data: clientFull } = await supabaseClient
        .from('clients')
        .select('first_name, last_name, email, phone, company_name, nif_cif, address_line1, address_line2, city, region, postal_code')
        .eq('id', orderDetails.client_id)
        .single()
      if (clientFull) {
        clientInfo = clientFull
      }
    }

    // Verificar si hay factura para este pedido
    let invoiceId: string | undefined = undefined
    if (status === 'delivered') {
      const { InvoiceService } = await import('@/lib/invoiceService')
      const { supabase: supabaseClient } = await import('@/lib/supabase')
      const { data: invoice } = await supabaseClient
        .from('invoices')
        .select('id')
        .eq('order_id', id)
        .single()
      if (invoice) {
        invoiceId = invoice.id
      }
    }

    const emailData = {
      orderId: orderDetails.id,
      orderNumber: orderDetails.id,
      status: status,
      clientName,
      clientEmail: clientEmail,
      items: orderDetails.order_items?.map((item: any) => {
        // Construir título del producto: product_title + variant_title si existe
        let productTitle = item.product_title || ''
        let variantTitle = item.variant_title || ''
        
        let title = ''
        if (productTitle && variantTitle) {
          title = `${productTitle} - ${variantTitle}`
        } else if (productTitle) {
          title = productTitle
        } else if (variantTitle) {
          title = variantTitle
        } else {
          title = 'Producto'
        }
        
        return {
          title,
          quantity: item.qty,
          price: (item.price_cents || 0) / 100
        }
      }) || [],
      total: (orderDetails.total_cents || 0) / 100,
      createdAt: orderDetails.created_at,
      shippingAddress,
      billingAddress,
      clientInfo,
      invoiceId: invoiceId || undefined
    }

    // Determinar recipients final
    const finalRecipients = (recipients === 'both' && !clientEmail) ? 'admin' : (recipients as 'client' | 'admin' | 'both')

    console.log(`📧 API: Enviando email con recipients: ${finalRecipients}`)
    
    // Enviar email
    const emailSent = await ServerEmailService.sendOrderStatusNotification(emailData, finalRecipients)
    
    if (emailSent) {
      console.log(`✅ API: Email enviado correctamente para pedido #${id}`)
      return NextResponse.json({ 
        success: true,
        message: 'Email enviado correctamente'
      })
    } else {
      console.error(`❌ API: No se pudo enviar el email para pedido #${id}`)
      return NextResponse.json(
        { success: false, error: 'No se pudo enviar el email' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ API: Error en send-status-email:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
