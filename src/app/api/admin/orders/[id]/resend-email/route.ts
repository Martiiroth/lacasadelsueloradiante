import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/adminService'
import { supabase } from '@/lib/supabase'
import ServerEmailService from '@/lib/emailService.server'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Verificación de autenticación
    const cookieStore = await cookies()
    const authToken = cookieStore.get('sb-access-token')?.value

    if (!authToken) {
      console.error('❌ No authorization token provided')
      return NextResponse.json(
        { error: 'No autorizado - Token requerido' },
        { status: 401 }
      )
    }

    // Verificar que el usuario es admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken)
    if (authError || !user) {
      console.error('❌ Invalid token or user not found:', authError)
      return NextResponse.json(
        { error: 'Token inválido o usuario no encontrado' },
        { status: 401 }
      )
    }

    // Verificar que el usuario tiene rol de admin
    const { data: client } = await supabase
      .from('clients')
      .select('customer_role:customer_roles(name)')
      .eq('id', user.id)
      .single()

    const isAdmin = client?.customer_role?.name === 'admin'
    if (!isAdmin) {
      console.error('❌ User is not admin:', user.email)
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      )
    }

    // Leer body para obtener recipients (después de verificar autenticación)
    let recipients: 'client' | 'admin' | 'both' = 'both'
    try {
      const body = await request.json()
      if (body && body.recipients && ['client', 'admin', 'both'].includes(body.recipients)) {
        recipients = body.recipients
      }
    } catch (bodyError) {
      // Si no hay body o es inválido, usar 'both' por defecto
      console.log('⚠️ No se pudo leer body o está vacío, usando recipients por defecto: both')
    }
    
    console.log('📧 Reenviando correo para pedido:', id, 'recipients:', recipients)
    
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

    // Enviar notificación directamente usando el servicio de email
    try {
      const emailSent = await ServerEmailService.sendOrderStatusNotification(emailData, recipients)
      
      if (emailSent) {
        console.log(`✅ Correo reenviado exitosamente para pedido #${orderDetails.id}`)
        return NextResponse.json({ 
          success: true,
          message: 'Correo reenviado exitosamente'
        })
      } else {
        console.error('Error reenviando correo: el servicio retornó false')
        return NextResponse.json(
          { error: 'Error al enviar el correo', details: 'El servicio de email retornó false' },
          { status: 500 }
        )
      }
    } catch (emailError) {
      console.error('Error enviando correo:', emailError)
      return NextResponse.json(
        { 
          error: 'Error al enviar el correo', 
          details: emailError instanceof Error ? emailError.message : 'Error desconocido al enviar el correo'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error en POST /api/admin/orders/[id]/resend-email:', error)
    
    // Asegurar que siempre devolvemos JSON válido
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error ? error.stack : String(error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor', 
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}

