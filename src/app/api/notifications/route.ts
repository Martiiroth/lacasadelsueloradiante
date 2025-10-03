import { NextRequest, NextResponse } from 'next/server'
import ServerEmailService from '@/lib/emailService.server'

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Notifications API - Received request')
    
    const body = await request.json()
    const { action, orderData } = body

    console.log('📧 Notifications API - Action:', action)
    console.log('📧 Notifications API - OrderData keys:', Object.keys(orderData || {}))

    if (!action || !orderData) {
      console.error('❌ Notifications API - Missing required fields')
      return NextResponse.json(
        { success: false, message: 'Action y orderData son requeridos' },
        { status: 400 }
      )
    }

    let result = false

    switch (action) {
      case 'send_order_notification':
        console.log('📧 Sending order status notification...')
        result = await ServerEmailService.sendOrderStatusNotification(orderData)
        break
      case 'send_new_order_notification':
        console.log('📧 Sending new order notification...')
        result = await ServerEmailService.sendNewOrderNotification(orderData)
        break
      case 'verify_configuration':
        console.log('📧 Verifying email configuration...')
        result = await ServerEmailService.verifyEmailConfiguration()
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