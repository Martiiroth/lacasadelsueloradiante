import { NextRequest, NextResponse } from 'next/server'
import ServerEmailService from '@/lib/emailService.server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, orderData } = body

    if (!action || !orderData) {
      return NextResponse.json(
        { success: false, message: 'Action y orderData son requeridos' },
        { status: 400 }
      )
    }

    let result = false

    switch (action) {
      case 'send_order_notification':
        result = await ServerEmailService.sendOrderStatusNotification(orderData)
        break
      case 'send_new_order_notification':
        result = await ServerEmailService.sendNewOrderNotification(orderData)
        break
      case 'verify_configuration':
        result = await ServerEmailService.verifyEmailConfiguration()
        break
      default:
        return NextResponse.json(
          { success: false, message: 'Acción no válida' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: result,
      message: result ? 'Email enviado exitosamente' : 'Error enviando email'
    })
  } catch (error) {
    console.error('Error in email API:', error)
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