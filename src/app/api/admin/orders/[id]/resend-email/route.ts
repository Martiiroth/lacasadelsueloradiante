import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/adminService'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    console.log('📧 Reenviando correo para pedido:', id)
    
    // Obtener el pedido completo
    const orderDetails = await AdminService.getOrderById(id)
    if (!orderDetails) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    // Obtener ID de factura si existe
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('order_id', id)
      .single()

    const invoiceId = invoice?.id || undefined

    // Preparar datos para el email (mismo formato que en updateOrderStatus)
    const clientName = orderDetails.client ? 
      `${orderDetails.client.first_name} ${orderDetails.client.last_name}`.trim() : 
      'Cliente'
    
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
      } else {
        shippingAddress = orderDetails.shipping_address;
      }
    }

    // Construir dirección de facturación
    let billingAddress = undefined;
    if (orderDetails.billing_address) {
      billingAddress = typeof orderDetails.billing_address === 'string'
        ? orderDetails.billing_address
        : JSON.stringify(orderDetails.billing_address, null, 2);
    }

    // Obtener todos los datos del cliente
    let clientInfo = undefined
    if (orderDetails.client_id) {
      const { data: clientFull } = await supabase
        .from('clients')
        .select('first_name, last_name, email, phone, company_name, nif_cif, address_line1, address_line2, city, region, postal_code')
        .eq('id', orderDetails.client_id)
        .single()
      if (clientFull) {
        clientInfo = clientFull
      }
    }

    // Obtener order_items con nombres personalizados desde orderDetails
    const items = orderDetails.order_items?.map((item: any) => ({
      // Si es producto personalizado, usar nombres guardados; si no, usar de la relación
      title: item.product_title 
        ? `${item.product_title}${item.variant_title ? ` - ${item.variant_title}` : ''}`
        : item.variant?.product?.title || 'Producto',
      quantity: item.qty,
      price: (item.price_cents || 0) / 100
    })) || []

    const emailData = {
      orderId: orderDetails.id,
      orderNumber: orderDetails.id,
      status: orderDetails.status,
      clientName,
      clientEmail: orderDetails.client?.email || '',
      items,
      total: (orderDetails.total_cents || 0) / 100,
      createdAt: orderDetails.created_at,
      shippingAddress,
      billingAddress,
      clientInfo,
      invoiceId // Incluir ID de factura si existe
    }

    console.log('📧 Datos para reenvío de email:', {
      status: emailData.status,
      clientEmail: emailData.clientEmail,
      invoiceId: emailData.invoiceId
    })

    // Enviar notificación usando API interna
    const apiUrl = typeof window === 'undefined' 
      ? 'http://localhost:3000/api/notifications'  // En servidor, usar localhost interno
      : '/api/notifications'  // En cliente, usar ruta relativa
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send_order_notification',
        orderData: emailData
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error en API de notificaciones:', errorText)
      return NextResponse.json(
        { error: 'Error al enviar el correo', details: errorText },
        { status: 500 }
      )
    }
    
    const result = await response.json()
    
    if (result.success) {
      console.log(`✅ Correo reenviado exitosamente para pedido #${orderDetails.id}`)
      return NextResponse.json({ 
        success: true,
        message: 'Correo reenviado exitosamente'
      })
    } else {
      console.error('Error reenviando correo:', result.message)
      return NextResponse.json(
        { error: 'Error al enviar el correo', details: result.message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error en POST /api/admin/orders/[id]/resend-email:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

