import { NextRequest, NextResponse } from 'next/server'
import ServerEmailService from '@/lib/emailService.server'

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Notifications API - Received request')
    
    const body = await request.json()
    const { action, orderData, registrationData } = body

    console.log('📧 Notifications API - Action:', action)
    console.log('📧 Notifications API - Data keys:', Object.keys(orderData || registrationData || {}))

    if (!action) {
      console.error('❌ Notifications API - Missing action')
      return NextResponse.json(
        { success: false, message: 'Action es requerido' },
        { status: 400 }
      )
    }

    // Validar que tenemos los datos necesarios según la acción
    if (['send_order_notification', 'send_new_order_notification'].includes(action) && !orderData) {
      console.error('❌ Notifications API - Missing orderData for order action')
      return NextResponse.json(
        { success: false, message: 'orderData es requerido para acciones de pedidos' },
        { status: 400 }
      )
    }

    if (action === 'send_new_registration_notification' && !registrationData) {
      console.error('❌ Notifications API - Missing registrationData for registration action')
      return NextResponse.json(
        { success: false, message: 'registrationData es requerido para notificaciones de registro' },
        { status: 400 }
      )
    }

    let result = false

    switch (action) {
      case 'send_order_notification':
        console.log('📧 Sending order status notification...')
        console.log('📧 Order data for email:', {
          orderId: orderData.orderId,
          status: orderData.status,
          clientEmail: orderData.clientEmail,
          invoiceId: orderData.invoiceId,
          invoiceNumber: orderData.invoiceNumber
        })
        result = await ServerEmailService.sendOrderStatusNotification(orderData)
        console.log('📧 Email service result:', result)
        break
      case 'send_new_order_notification':
        console.log('📧 Sending new order notification...')
        result = await ServerEmailService.sendNewOrderNotification(orderData)
        break
      case 'verify_configuration':
        console.log('📧 Verifying email configuration...')
        result = await ServerEmailService.verifyEmailConfiguration()
        break
      case 'send_new_registration_notification':
        console.log('📧 Sending new registration notification...')
        result = await ServerEmailService.sendNewRegistrationNotification(registrationData)
        break
      default:
        console.error('❌ Invalid action:', action)
        return NextResponse.json(
          { success: false, message: 'Acción no válida' },
          { status: 400 }
        )
    }

    console.log('📧 Notifications API - Result:', result)

    return NextResponse.json({
      success: result,
      message: result ? 'Email enviado exitosamente' : 'Error enviando email'
    })
  } catch (error) {
    console.error('❌ Error in notifications API:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}