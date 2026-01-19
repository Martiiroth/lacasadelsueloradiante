import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/adminService'
import ServerEmailService from '@/lib/emailService.server'
import { createClient } from '@/utils/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    console.log('📧 [RESEND-EMAIL] Iniciando reenvío de correo para pedido:', id)
    
    // Verificación de autenticación usando el cliente de Supabase del servidor
    const supabase = await createClient()
    
    // Verificar que el usuario está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('📧 [RESEND-EMAIL] Autenticación verificada:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError ? authError.message : null
    })
    
    if (authError) {
      console.error('❌ Error de autenticación:', {
        error: authError,
        message: authError.message,
        status: authError.status
      })
      return NextResponse.json(
        { 
          success: false,
          error: 'No autorizado - Error de autenticación',
          details: authError.message || 'Token inválido o expirado'
        },
        { status: 401 }
      )
    }
    
    if (!user) {
      console.error('❌ Usuario no encontrado en la sesión')
      return NextResponse.json(
        { 
          success: false,
          error: 'No autorizado - Usuario no encontrado',
          details: 'Por favor, inicia sesión nuevamente'
        },
        { status: 401 }
      )
    }
    
    console.log('✅ Usuario autenticado:', {
      userId: user.id,
      email: user.email
    })

    // Verificar que el usuario tiene rol de admin
    console.log('📧 [RESEND-EMAIL] Buscando cliente con auth_uid:', user.id)
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select(`
        *,
        customer_role:customer_roles(*)
      `)
      .eq('auth_uid', user.id)
      .single()
    
    console.log('📧 [RESEND-EMAIL] Resultado de búsqueda de cliente:', {
      hasClient: !!client,
      clientId: client?.id,
      roleName: (client?.customer_role as any)?.name,
      clientError: clientError ? {
        message: clientError.message,
        code: clientError.code,
        details: clientError.details
      } : null
    })

    if (clientError) {
      console.error('❌ Error obteniendo cliente:', {
        error: clientError,
        message: clientError.message,
        code: clientError.code,
        details: clientError.details,
        hint: clientError.hint,
        userId: user.id,
        userEmail: user.email
      })
      // Si el error es "no rows", significa que el cliente no existe, no necesariamente un error crítico
      if (clientError.code === 'PGRST116') {
        console.log('⚠️ Cliente no encontrado en base de datos para este usuario')
        return NextResponse.json(
          { 
            success: false,
            error: 'No tienes permisos para realizar esta acción. Tu cuenta no está registrada en el sistema.',
            details: 'Por favor, contacta con el administrador para obtener acceso.'
          },
          { status: 403 }
        )
      }
      return NextResponse.json(
        { 
          success: false,
          error: 'No se pudo verificar los permisos del usuario',
          details: clientError.message || 'Error al obtener información del cliente'
        },
        { status: 403 }
      )
    }

    if (!client) {
      console.error('❌ Cliente no encontrado para usuario:', {
        userId: user.id,
        userEmail: user.email
      })
      return NextResponse.json(
        { 
          success: false,
          error: 'Cliente no encontrado. Por favor, contacta con el administrador.',
          details: 'Tu cuenta de usuario no está asociada a un cliente en el sistema.'
        },
        { status: 403 }
      )
    }

    const roleName = (client.customer_role as any)?.name
    const isAdmin = roleName === 'admin'
    
    if (!isAdmin) {
      console.error('❌ User is not admin:', {
        userEmail: user.email,
        userId: user.id,
        roleName: roleName || 'sin rol',
        clientId: client.id
      })
      return NextResponse.json(
        { 
          success: false,
          error: 'No tienes permisos para realizar esta acción. Se requiere rol de administrador.',
          details: `Tu rol actual: ${roleName || 'sin rol'}`
        },
        { status: 403 }
      )
    }
    
    console.log('✅ Usuario autenticado como admin:', {
      userId: user.id,
      userEmail: user.email,
      clientId: client.id
    })

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
      clientEmail: orderDetails.client?.email || (orderDetails as any).guest_email || '',
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

